import { db } from '@/lib/db';
import { carts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getOrCreateCart(userId: string) {
  const existing = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });
  if (existing) return existing;

  const [cart] = await db
    .insert(carts)
    .values({
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    .returning();
  return cart;
}
