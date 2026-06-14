// Rate limiter in memoria (sliding window log).
// NB: stato per-processo. Su Vercel multi-istanza ogni lambda ha la sua Map;
// accettabile per un portfolio. Per produzione seria: Redis/Upstash.

type Bucket = number[]; // timestamp (ms) delle richieste nella finestra

const store = new Map<string, Bucket>();

// Sweep periodico delle chiavi completamente scadute (evita memory leak).
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, timestamps] of store) {
    // se l'ultima richiesta è più vecchia di 1h, la chiave è morta
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > 3_600_000) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** secondi prima di poter riprovare (0 se success) */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  sweep(now);

  // prune della chiave corrente: tieni solo i timestamp dentro la finestra
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    store.set(key, timestamps);
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    return { success: false, remaining: 0, retryAfter: Math.max(retryAfter, 1) };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { success: true, remaining: limit - timestamps.length, retryAfter: 0 };
}

/** Estrae l'IP del client dagli header proxy, con fallback. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return '127.0.0.1';
}
