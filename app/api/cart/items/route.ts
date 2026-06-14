import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { cartItems, products } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getOrCreateCart } from '@/lib/cart';
import { addCartItemSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = addCartItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dati non validi', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { productId, quantity } = parsed.data;

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product || !product.isActive) {
    return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
  }

  if (product.stockQuantity < quantity) {
    return NextResponse.json(
      { error: 'Stock insufficiente', available: product.stockQuantity },
      { status: 400 }
    );
  }

  const cart = await getOrCreateCart(session.user.id);

  const [item] = await db
    .insert(cartItems)
    .values({
      cartId: cart.id,
      productId,
      quantity,
      priceSnapshot: product.price,
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: {
        quantity: sql`${cartItems.quantity} + ${quantity}`,
        priceSnapshot: product.price,
      },
    })
    .returning();

  return NextResponse.json({ item }, { status: 201 });
}
