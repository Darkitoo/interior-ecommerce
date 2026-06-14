import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { carts, cartItems } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { updateCartItemSchema } from '@/lib/validators';

async function getOwnedItem(userId: string, itemId: string) {
  const rows = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(cartItems.id, itemId), eq(carts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { itemId } = await params;

  const owned = await getOwnedItem(session.user.id, itemId);
  if (!owned) {
    return NextResponse.json({ error: 'Item non trovato' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateCartItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dati non validi', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(cartItems)
    .set({ quantity: parsed.data.quantity })
    .where(eq(cartItems.id, itemId))
    .returning();

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  const { itemId } = await params;

  const owned = await getOwnedItem(session.user.id, itemId);
  if (!owned) {
    return NextResponse.json({ error: 'Item non trovato' }, { status: 404 });
  }

  await db.delete(cartItems).where(eq(cartItems.id, itemId));

  return NextResponse.json({ success: true });
}
