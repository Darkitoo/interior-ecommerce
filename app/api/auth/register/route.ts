import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/utils/hash';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: limit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password e nome sono obbligatori' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere almeno 8 caratteri' },
        { status: 400 }
      );
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'customer',
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });

    return NextResponse.json({ user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
