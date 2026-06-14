import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/db/schema';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const userId = session.user.id;

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.userId, userId)),
      columns: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Solo gli ordini in attesa possono essere annullati' },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error('[POST /api/orders/[id]/cancel]', err);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
