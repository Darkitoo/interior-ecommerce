import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/db/schema';
import { productUpdateSchema } from '@/lib/validators';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
    }
    const body = { ...raw };
    for (const k of ['description', 'imageUrl', 'categoryId']) {
      if (body[k] === '') body[k] = undefined;
    }
    if (typeof body.cost === 'number' && Number.isNaN(body.cost)) body.cost = undefined;

    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (d.name !== undefined) updates.name = d.name;
    if (d.sku !== undefined) updates.sku = d.sku;
    if (d.description !== undefined) updates.description = d.description ?? null;
    if (d.price !== undefined) updates.price = d.price.toFixed(2);
    if (d.cost !== undefined) updates.cost = d.cost != null ? d.cost.toFixed(2) : null;
    if (d.stockQuantity !== undefined) updates.stockQuantity = d.stockQuantity;
    if (d.categoryId !== undefined) updates.categoryId = d.categoryId ?? null;
    if (d.isActive !== undefined) updates.isActive = d.isActive;
    if (d.imageUrl !== undefined) updates.imageUrl = d.imageUrl ?? null;

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'SKU già esistente' }, { status: 409 });
    }
    console.error('[PATCH /api/products/[id]]', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
