import { NextResponse } from 'next/server';

// Helper per risposte API consistenti. Adozione graduale: le route esistenti
// non sono state migrate. Gli helper NON includono mai stack trace.

interface SuccessMeta {
  timestamp: string;
  requestId: string;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  const meta: SuccessMeta = {
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
  return NextResponse.json({ data, meta }, { status });
}

export function apiError(
  code: string,
  message: string,
  details?: unknown,
  status = 400
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status }
  );
}

export function apiUnauthorized(message = 'Non autenticato'): NextResponse {
  return apiError('UNAUTHORIZED', message, undefined, 401);
}

export function apiForbidden(message = 'Accesso negato'): NextResponse {
  return apiError('FORBIDDEN', message, undefined, 403);
}

export function apiNotFound(message = 'Risorsa non trovata'): NextResponse {
  return apiError('NOT_FOUND', message, undefined, 404);
}

export function apiTooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests',
        details: { retryAfter },
      },
    },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
