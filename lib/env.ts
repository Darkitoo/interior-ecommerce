import { z } from 'zod';

// Validazione delle variabili d'ambiente al boot. Importato (side-effect) in
// lib/db.ts, lib/stripe.ts, lib/auth.ts: il primo import del server fa fallire
// l'avvio in modo esplicito se manca/è invalida una variabile.

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  // opzionale in dev (NextAuth la inferisce), obbligatoria in produzione
  NEXTAUTH_URL: isProd ? z.string().url() : z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Variabili d'ambiente non valide o mancanti:\n${issues}\n` +
      `Controlla il tuo .env.local (o le env vars su Vercel).`
  );
}

export const env = parsed.data;
