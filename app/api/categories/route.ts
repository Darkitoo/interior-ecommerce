import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/db/schema';

export async function GET() {
  try {
    const result = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(asc(categories.name));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error('[GET /api/categories]', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle categorie' },
      { status: 500 }
    );
  }
}
