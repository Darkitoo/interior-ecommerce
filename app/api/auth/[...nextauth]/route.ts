import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const { GET } = handlers;

// Il login con credenziali arriva su POST /api/auth/callback/credentials.
// Applichiamo il rate limit solo lì; ogni altro POST NextAuth passa intatto.
export async function POST(req: NextRequest): Promise<Response> {
  if (req.nextUrl.pathname.includes('/callback/credentials')) {
    const ip = getClientIp(req);
    const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: limit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }
  }
  return handlers.POST(req);
}
