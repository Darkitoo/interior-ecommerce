import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  payments,
  products,
  inventoryLogs,
  carts,
  cartItems,
} from '@/db/schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Firma mancante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: 'Firma non valida' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      await handlePaymentSucceeded(event.data.object);
    } else if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentFailed(event.data.object);
    }
  } catch (err) {
    console.error(`[webhook] ${event.type}:`, err);
  }

  return NextResponse.json({ received: true });
}

// ─── payment_intent.succeeded ──────────────────────────────────────────────

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) {
    console.error('[webhook] payment_intent.succeeded: orderId assente in metadata', pi.id);
    return;
  }

  // Idempotency check — fuori transazione per velocità
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) {
    console.error('[webhook] payment_intent.succeeded: ordine non trovato', orderId);
    return;
  }
  if (order.status === 'paid') return; // già processato

  // Carica gli item dell'ordine
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  await db.transaction(async (tx) => {
    // 1. Aggiorna stato ordine
    await tx
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // 2. Registra il pagamento
    await tx.insert(payments).values({
      orderId,
      stripePaymentId: pi.id,
      amount: (pi.amount / 100).toFixed(2),
      currency: pi.currency,
      status: 'succeeded',
      paymentMethod: pi.payment_method_types[0] ?? null,
    });

    // 3. Scala stock e logga inventario
    for (const item of items) {
      await tx
        .update(products)
        .set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
        .where(eq(products.id, item.productId));

      await tx.insert(inventoryLogs).values({
        productId: item.productId,
        quantityChange: -item.quantity,
        reason: 'purchase',
        orderId,
      });
    }

    // 4. Svuota il carrello dell'utente
    const [cart] = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, order.userId));

    if (cart) {
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    }
  });
}

// ─── payment_intent.payment_failed ────────────────────────────────────────

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;

  const errorMessage =
    (pi.last_payment_error as { message?: string } | null)?.message ?? 'Pagamento fallito';

  const existing = await db.query.payments.findFirst({
    where: eq(payments.stripePaymentId, pi.id),
  });

  if (existing) {
    if (existing.status === 'succeeded') return; // non degradare un pagamento riuscito
    await db
      .update(payments)
      .set({ status: 'failed', errorMessage, updatedAt: new Date() })
      .where(eq(payments.stripePaymentId, pi.id));
  } else {
    await db.insert(payments).values({
      orderId,
      stripePaymentId: pi.id,
      amount: (pi.amount / 100).toFixed(2),
      currency: pi.currency,
      status: 'failed',
      errorMessage,
    });
  }
}
