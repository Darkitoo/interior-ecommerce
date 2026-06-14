import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { userUpdateSchema } from '@/lib/validators';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    const userId = session.user.id;

    const raw = await req.json().catch(() => null);
    if (!raw || typeof raw !== 'object') {
      return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
    }
    const body = { ...raw };
    if (body.phone === '') body.phone = undefined;

    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, phone } = parsed.data;

    const [updated] = await db
      .update(users)
      .set({ name, phone: phone ?? null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      });

    if (!updated) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[PATCH /api/users/me]', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
