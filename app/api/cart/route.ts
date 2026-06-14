import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { carts, cartItems, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateCart } from '@/lib/cart';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const cart = await getOrCreateCart(session.user.id);

  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      name: products.name,
      imageUrl: products.imageUrl,
      unitPrice: products.price,
      stockQuantity: products.stockQuantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  const items = rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    name: row.name,
    imageUrl: row.imageUrl,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    lineTotal: (parseFloat(row.unitPrice) * row.quantity).toFixed(2),
    inStock: row.stockQuantity >= row.quantity,
  }));

  const total = items.reduce((sum, item) => sum + parseFloat(item.lineTotal), 0);

  return NextResponse.json({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total: total.toFixed(2),
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, session.user.id),
  });

  if (cart) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  return NextResponse.json({ success: true });
}
