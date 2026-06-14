# Progress Handoff

## Stato produzione (LIVE)
- URL produzione: https://interior-ecommerce-seven.vercel.app
- Repo GitHub (pubblico): https://github.com/Darkitoo/interior-ecommerce
- Branch main → push su main = auto-deploy su Vercel
- Progetto Vercel: interior-ecommerce (team walterspina2003-4929, Hobby/Free)
- Env vars di produzione configurate su Vercel: DATABASE_URL (Neon poolata
  nuova), NEXTAUTH_SECRET, NEXTAUTH_URL=https://interior-ecommerce-seven.vercel.app,
  STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (TEST),
  STRIPE_WEBHOOK_SECRET (whsec_ di PRODUZIONE, diverso da quello locale della CLI)
- Webhook Stripe produzione: endpoint /api/payments/webhook, evento
  payment_intent.succeeded, Stripe in modalità TEST/sandbox
- Verificato end-to-end: pagamento test 4242 -> ordine passato a 'paid'
  via webhook di produzione

## Note sicurezza (risolto)
- La password Neon è stata RUOTATA: il vecchio .claude/settings.local.json
  era finito nel repo pubblico esponendo la connection string
- .claude/ ora è nel .gitignore e rimosso da repo + history (force push)
- La credenziale esposta è morta dopo la rotazione

## Stato attuale
- Fase 1 (setup, DB, auth): COMPLETA
- Fase 2 (prodotti, categorie, admin prodotti): COMPLETA  
- Fase 3 (carrello, checkout, Stripe, webhook): COMPLETA e TESTATA
- Fase 4 (dashboard utente): COMPLETA
- Fase 4b (admin dashboard): COMPLETA
- Fase 5a (sicurezza): COMPLETA
- Fase 5b (deploy): COMPLETA

## Stack confermato a runtime
- Next.js 16, TypeScript, Tailwind CSS
- Drizzle ORM con driver postgres-js (supporta db.transaction() nativamente)
- PostgreSQL/Neon, NextAuth v5, Stripe v22
- params SEMPRE async in Next.js 16: const { id } = await params
- GET /api/cart ritorna struttura PIATTA: { items, itemCount, total } (no wrapper)
- total/unitPrice/lineTotal arrivano come stringhe da Postgres -> Number()
- session.user.id già popolato nei callback NextAuth
- Relations Drizzle già definite (carts->cartItems->products, ecc.)

## File chiave creati in Fase 3
- lib/cart.ts (getOrCreateCart)
- lib/stripe.ts (client Stripe server-side)
- lib/validators.ts (addCartItemSchema, updateCartItemSchema, createOrderSchema)
- app/api/cart/route.ts (GET, DELETE)
- app/api/cart/items/route.ts (POST con onConflictDoUpdate)
- app/api/cart/items/[itemId]/route.ts (PATCH, DELETE con ownership check)
- app/api/orders/route.ts (POST: ricalcolo server-side, transazione atomica,
  Payment Intent Stripe, NON scala stock qui)
- app/api/payments/webhook/route.ts (verifica firma, payment_intent.succeeded:
  ordine->paid + payments + inventory_logs + svuota carrello, idempotente)
- components/providers/SessionProvider.tsx
- app/(shop)/checkout/page.tsx (flusso a due fasi: indirizzo -> Stripe Elements)
- app/(shop)/order-confirmation/[id]/page.tsx (minimale, da arricchire)

## Quirk importanti
- Webhook: runtime = 'nodejs', raw body via req.text(), firma whsec_ in .env.local
- Stock scalato SOLO nel webhook (payment_intent.succeeded), mai al POST /api/orders
- Carrello svuotato SOLO nel webhook, mai nel client
- Idempotenza webhook: se ordine già 'paid', risponde 200 senza fare nulla
- STRIPE_WEBHOOK_SECRET in .env.local (locale: whsec_ dalla CLI)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY per il client Stripe Elements

## Completato dopo Fase 5a (gap Fase 2 + profilo)
- Admin prodotti: pagine /admin/products/[id]/edit e /new ora ESISTONO
  (ProductEditForm client, RHF + Zod)
- API mutazione prodotti create da zero: POST /api/products,
  PATCH /api/products/[id] (solo admin, unicità SKU -> 409)
- GET /api/categories (pubblica) per il select del form
- Profilo utente: /dashboard/profile + PATCH /api/users/me (name, phone)
- NB: @hookform/resolvers NON installato -> validazione Zod manuale in onSubmit

## Stato finale pre-deploy
Tutto il core è completo e funzionante localmente:
- Catalog, auth, carrello, checkout Stripe, webhook, dashboard utente, 
  admin dashboard, sicurezza (rate limiting, headers, middleware)

## To-do per versione finale portfolio

### Fase 6 — Contenuto e UX (priorità 2, ~1 ora)
- Immagine rotta "Lampada da Tavolo Minimal" (URL nel DB) — FATTA
- Ruolo admin impostato — FATTO
- Seed dati più ricchi: almeno 15-20 prodotti con immagini Unsplash belle
- Paginazione lista ordini admin (ora carica tutto)

### Fase 7 — Feature aggiuntive (priorità 3, ~3-4 ore)
- Upload immagini prodotti con Cloudflare R2 
  (ora si inserisce solo URL a mano)
- Email conferma ordine con Resend 
  (da triggerare nel webhook dopo payment_intent.succeeded)
- Rimborso Stripe automatico quando si annulla un ordine in stato 'paid'

### Fase 8 — Monitoring (priorità 4, ~1 ora)
- Sentry error tracking (account free + DSN in env vars)
- README professionale con screenshot, stack, setup locale

### Note tecniche per domani
- stripe listen va riavviato ad ogni sessione di sviluppo
- STRIPE_WEBHOOK_SECRET locale (whsec_ dalla CLI) != quello di produzione
- @hookform/resolvers non installato: i form usano validazione Zod manuale
- params sempre async in Next.js 16
- Fix build per produzione: /login usava useSearchParams() senza confine
  Suspense -> estratto il form in components/auth/LoginForm.tsx avvolto in
  <Suspense> nella pagina (necessario per il prerender statico)
