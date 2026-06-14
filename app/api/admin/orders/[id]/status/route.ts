import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';

const VALID_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const status = body?.status as string | undefined;

    if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }

    const updates: {
      status: OrderStatus;
      updatedAt: Date;
      shippedAt?: Date;
      deliveredAt?: Date;
    } = {
      status: status as OrderStatus,
      updatedAt: new Date(),
    };
    if (status === 'shipped') {
      updates.shippedAt = new Date();
    }
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
    }

    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    }

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error('[PATCH /api/admin/orders/[id]/status]', err);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
