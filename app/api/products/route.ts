import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { products } from '@/db/schema';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { productCreateSchema } from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const conditions = [eq(products.isActive, true)];

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    let orderBy;
    switch (sortBy) {
      case 'price_asc':
        orderBy = asc(products.price);
        break;
      case 'price_desc':
        orderBy = desc(products.price);
        break;
      default:
        orderBy = desc(products.createdAt);
    }

    const result = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(orderBy);

    return NextResponse.json({ products: result });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei prodotti' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
    // normalizza stringhe vuote / NaN -> undefined per i campi opzionali
    const body = { ...raw };
    for (const k of ['description', 'imageUrl', 'categoryId']) {
      if (body[k] === '') body[k] = undefined;
    }
    if (typeof body.cost === 'number' && Number.isNaN(body.cost)) body.cost = undefined;

    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const [created] = await db
      .insert(products)
      .values({
        name: d.name,
        sku: d.sku,
        description: d.description ?? null,
        price: d.price.toFixed(2),
        cost: d.cost != null ? d.cost.toFixed(2) : null,
        stockQuantity: d.stockQuantity,
        categoryId: d.categoryId ?? null,
        isActive: d.isActive ?? true,
        imageUrl: d.imageUrl ?? null,
      })
      .returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'SKU già esistente' }, { status: 409 });
    }
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
