import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { addresses, carts, cartItems, orders, orderItems, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { createOrderSchema } from '@/lib/validators';

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { shippingAddress, billingAddress } = parsed.data;
    const billing = billingAddress ?? shippingAddress;

    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
    });
    if (!cart) {
      return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 });
    }

    const rows = await db
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        name: products.name,
        livePrice: products.price,
        stock: products.stockQuantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Carrello vuoto' }, { status: 400 });
    }

    for (const row of rows) {
      if (row.stock < row.quantity) {
        return NextResponse.json(
          {
            error: 'Stock insufficiente',
            product: {
              id: row.productId,
              name: row.name,
              available: row.stock,
              requested: row.quantity,
            },
          },
          { status: 400 },
        );
      }
    }

    const subtotal = rows.reduce((sum, r) => sum + Number(r.livePrice) * r.quantity, 0);
    const totalAmount = subtotal;

    const { orderId, orderNumber } = await db.transaction(async (tx) => {
      const [shippingAddr] = await tx
        .insert(addresses)
        .values({ userId, type: 'shipping' as const, ...shippingAddress })
        .returning({ id: addresses.id });

      const [billingAddr] = await tx
        .insert(addresses)
        .values({ userId, type: 'billing' as const, ...billing })
        .returning({ id: addresses.id });

      const orderNum = generateOrderNumber();
      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber: orderNum,
          userId,
          status: 'pending' as const,
          subtotal: subtotal.toFixed(2),
          taxAmount: '0.00',
          shippingCost: '0.00',
          discountAmount: '0.00',
          totalAmount: totalAmount.toFixed(2),
          shippingAddressId: shippingAddr.id,
          billingAddressId: billingAddr.id,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(
        rows.map((r) => ({
          orderId: order.id,
          productId: r.productId,
          quantity: r.quantity,
          unitPrice: Number(r.livePrice).toFixed(2),
          subtotal: (Number(r.livePrice) * r.quantity).toFixed(2),
        })),
      );

      return { orderId: order.id, orderNumber: order.orderNumber };
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'eur',
      metadata: { orderId, orderNumber },
      automatic_payment_methods: { enabled: true },
    });

    await db
      .update(orders)
      .set({ stripePaymentId: paymentIntent.id })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      orderId,
      orderNumber,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    });
  } catch (err) {
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
