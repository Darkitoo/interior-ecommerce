# PROGRESS — Interior E-commerce

> Audit oggettivo dello stato del progetto e roadmap verso un e-commerce
> production-grade / portfolio-grade. Priorità: P0 = serve davvero, P1 = atteso
> da un e-commerce professionale, P2 = extra che alza l'asticella. Ogni blocco
> ha una Definition of Done.

---

## ⏭️ DA QUI SI RIPARTE (prossimo step)

**Workstream 1 — Frontend responsive & UX.** Primo task concreto:
1. Aggiungere il link "I miei ordini" nella navbar (la pagina esiste già ma non è raggiungibile dal menu).
2. Rendere la navbar responsive con hamburger + drawer su mobile.
3. A seguire, gli stati UI (loading/empty/error) e i toast su ogni azione.
Vedi sezione §1 per il dettaglio completo. NON iniziare da feature backend: il gap è tutto frontend/UX.

---

## 🟢 Stato produzione (LIVE)

- URL produzione: https://interior-ecommerce-seven.vercel.app
- Repo (pubblico): https://github.com/Darkitoo/interior-ecommerce
- Branch main → ogni push su main = auto-deploy su Vercel
- Progetto Vercel: interior-ecommerce (team walterspina2003-4929, Hobby/Free)
- Env vars produzione (Vercel): DATABASE_URL (Neon poolata nuova), NEXTAUTH_SECRET,
  NEXTAUTH_URL=https://interior-ecommerce-seven.vercel.app, STRIPE_SECRET_KEY +
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (TEST), STRIPE_WEBHOOK_SECRET (whsec_ di
  PRODUZIONE, diverso da quello locale CLI)
- Webhook Stripe produzione: endpoint /api/payments/webhook, evento
  payment_intent.succeeded, Stripe in modalità TEST/sandbox
- Verificato end-to-end: pagamento test 4242 → ordine passato a paid via webhook

### Note sicurezza (risolto)
- Password Neon ruotata: il vecchio .claude/settings.local.json era nel repo pubblico esponendo la connection string.
- .claude/ ora in .gitignore e rimosso da repo + history (force push).
- Credenziale esposta morta dopo la rotazione → incidente chiuso.

---

## ✅ Completato (backend solido)

- [x] Fase 1 — setup, DB, auth (NextAuth v5)
- [x] Fase 2 — prodotti, categorie, admin prodotti (CRUD via URL immagine)
- [x] Fase 3 — carrello, checkout, Stripe, webhook (idempotente, transazione atomica)
- [x] Fase 4 — dashboard utente (ordini lista + dettaglio, profilo)
- [x] Fase 4b — admin dashboard (ordini, stats, prodotti)
- [x] Fase 5a — sicurezza (rate limiting, security headers, middleware)
- [x] Fase 5b — deploy produzione + verifica end-to-end
- [x] Fix immagine "Lampada da Tavolo Minimal" + ruolo admin impostato

---

## 🔧 Stack & quirk tecnici (handoff sessioni future)

- Next.js 16 · TypeScript · Tailwind · Drizzle (postgres-js, db.transaction() nativo)
- PostgreSQL/Neon · NextAuth v5 · Stripe v22
- params SEMPRE async in Next.js 16: const { id } = await params
- GET /api/cart ritorna struttura PIATTA { items, itemCount, total } (no wrapper)
- total/unitPrice/lineTotal arrivano come stringhe da Postgres → Number()
- session.user.id già popolato nei callback NextAuth
- Stock scalato e carrello svuotato SOLO nel webhook (payment_intent.succeeded), mai al POST ordine
- Webhook: runtime = 'nodejs', raw body via req.text(), idempotente (se già paid → 200 e basta)
- Fix prod: /login usava useSearchParams() senza confine Suspense → form estratto in components/auth/LoginForm.tsx avvolto in <Suspense> (serve per il prerender statico)
- @hookform/resolvers NON installato → validazione Zod manuale negli onSubmit

---

# 📋 Roadmap verso "production / portfolio-grade"

> Valutazione onesta: backend completo e ben fatto, prodotto a metà. Il frontend
> non è mai stato rifinito a mano, non è responsive, mancano stati UI, accessibilità,
> SEO, pagine legali (GDPR, EU) e diverse feature attese. Sotto, tutto, in ordine di impatto.

## 1 · Frontend, responsive & UX — P0 (il gap più grosso)
- [ ] Responsive completo (mobile 360 / tablet 768 / desktop 1280+) su OGNI pagina: home, lista prodotti, dettaglio, carrello, checkout, dashboard, admin, login/register.
- [ ] Navbar mobile: hamburger + drawer, con catalogo, carrello (badge), account.
- [ ] Link "I miei ordini" nella nav (oggi la pagina esiste ma non è raggiungibile — bug UX). Aggiungere anche menu utente Profilo/Logout.
- [ ] Stati di caricamento: skeleton/spinner su griglia prodotti, ordini, checkout.
- [ ] Stati vuoti: carrello vuoto, nessun ordine, nessun risultato, categoria vuota — con CTA.
- [ ] Stati di errore: error boundary + pagina errore amichevole; mai stacktrace in faccia.
- [ ] Toast/notifiche su ogni azione (aggiunto al carrello, ordine creato, errore, profilo salvato). Es. sonner o react-hot-toast.
- [ ] Stati bottoni: hover, active, disabled, loading (spinner nel bottone durante submit, evita doppio checkout).
- [ ] Validazione form con UX: errori inline per campo. Valuta @hookform/resolvers per Zod + RHF pulito.
- [ ] 404 e 500 custom brandizzate.
- [ ] Design system minimo: scala spaziatura/tipografica/palette coerenti (token).
- [ ] Micro-interazioni sobrie (hover, aggiunta carrello).
DoD: dal telefono e dal desktop navighi l'intero flusso senza un layout rotto, senza schermate bianche, con feedback su ogni click.

## 2 · Funzionalità e-commerce mancanti — P0/P1
- [ ] Ricerca prodotti (su nome/descrizione). P0
- [ ] Ordinamento lista prodotti (prezzo ↑↓, più recenti). P1
- [ ] Filtri (categoria c'è + fascia di prezzo). P1
- [ ] Paginazione lista prodotti E lista ordini admin. P0
- [ ] Selettore quantità su dettaglio e carrello (+/−, max = stock). P0
- [ ] Stock in UI: badge "Solo N rimasti", disabilita add-to-cart se 0 / "Esaurito". P0
- [ ] Annulla ordine in UI: l'endpoint cancel esiste, esporlo con bottone + conferma su ordini pending. P1
- [ ] Indirizzi salvati nel profilo (riusare in checkout). P1
- [ ] Recensioni/rating prodotto. P2
- [ ] Wishlist/preferiti. P2
- [ ] Codici sconto/coupon. P2
- [ ] Tasse & spedizione: oggi 0 € — renderlo intenzionale (es. spedizione gratis sopra soglia) e mostrarlo. P1
DoD: l'utente cerca, ordina per prezzo, sceglie quantità, vede l'esaurito, non compra più del disponibile.

## 3 · Admin completeness — P1
- [ ] Upload immagini prodotto (Cloudflare R2) invece di URL a mano. P1
- [ ] Gestione ordini admin: cambio stato, filtro per stato, ricerca, paginazione. P1
- [ ] Vista inventario / low-stock alert. P2
- [ ] Analytics admin: revenue, ordini per stato, top prodotti, andamento (grafico). P2
- [ ] Lista clienti (sola lettura). P2
- [ ] Verifica che TUTTE le route /admin/** e le API admin siano protette role==='admin'. P0
DoD: gestisci l'intero ciclo di vita prodotto/ordine dall'admin senza toccare il DB a mano.

## 4 · Contenuto & dati — P0
- [ ] Seed 15–20+ prodotti con immagini Unsplash di qualità, descrizioni vere, dimensioni/materiali, prezzi realistici.
- [ ] Distribuzione sensata tra categorie (Arredamento, Illuminazione, Decorazioni…).
- [ ] Immagini coerenti con la palette del brand (terracotta/beige).
- [ ] Eventuale hero/immagine per categoria.
DoD: la home sembra un catalogo curato, non dati di test.

## 5 · SEO, performance & accessibilità — P1
- [ ] Metadata per pagina (title/description dinamici, soprattutto sui prodotti).
- [ ] Open Graph / Twitter card.
- [ ] sitemap.xml + robots.txt.
- [ ] JSON-LD Product schema sulle pagine prodotto.
- [ ] next/image ovunque con sizes corretti, lazy load, blur placeholder.
- [ ] ISR/SSG dove ha senso (pagine prodotto cacheabili).
- [ ] Accessibilità WCAG AA: HTML semantico, alt su tutte le immagini, navigazione da tastiera, focus visibile, ARIA, contrasto, focus trap nei modali.
- [ ] Audit Lighthouse → 90+ su Performance/Accessibility/Best Practices/SEO (screenshot nel README).
- [ ] Vercel Web Analytics + Speed Insights attivati.
DoD: Lighthouse mobile 90+ in tutte e 4 le categorie, navigazione completa da tastiera, anteprima link decente.

## 6 · Legale & trust — P0 (EU → GDPR)
- [ ] Cookie consent banner (GDPR).
- [ ] Privacy Policy.
- [ ] Termini e Condizioni.
- [ ] Politica di reso/rimborso.
- [ ] Pagina Contatti (+ form).
- [ ] Pagina Chi siamo / About.
- [ ] Footer completo: link a tutte le pagine sopra, social, copyright.
DoD: ogni link del footer porta a una pagina reale; il banner cookie compare al primo accesso.

## 7 · Email & notifiche — P1
- [ ] Email conferma ordine (Resend) triggerata nel webhook dopo payment_intent.succeeded, con riepilogo + indirizzo.
- [ ] Email benvenuto alla registrazione. P2
- [ ] Email cambio stato ordine (spedito/consegnato) se aggiungi quegli stati. P2
- [ ] Template email decenti (non testo grezzo).
DoD: completi un acquisto e ricevi una mail di conferma formattata.

## 8 · Pagamenti — robustezza — P1
- [ ] Gestione payment_intent.payment_failed (oggi solo successo): ordine → fallito, messaggio chiaro.
- [ ] Rimborso Stripe automatico quando si annulla un ordine paid.
- [ ] Messaggi d'errore pagamento chiari lato client.
- [ ] Gestione retry/ordine eventi webhook (oltre all'idempotenza già presente).
DoD: una carta che fallisce (4000 0000 0000 0002) non lascia ordini fantasma in pending e mostra un errore comprensibile.

## 9 · Qualità ingegneristica — P1/P2
- [ ] Error tracking (Sentry) — account free + DSN in env. P1
- [ ] README professionale: descrizione, screenshot/GIF, stack, diagramma architettura, feature list, setup locale, env vars, link demo, note deploy. P0 per portfolio
- [ ] Test dei flussi critici (carrello, checkout, webhook) — Vitest + Playwright e2e. P2
- [ ] CI GitHub Actions: typecheck + lint + build su push/PR (badge nel README). P2
- [ ] Indici DB su colonne più interrogate (products.categoryId, orders.userId, orders.status). P1
- [ ] Workflow migrazioni Drizzle versionato (non solo push). P2
- [ ] Content-Security-Policy vera. P2
- [ ] Logging strutturato su webhook/pagamenti. P2
DoD: un dev capisce tutto dal README in 2 minuti e vede la CI verde.

---

## 🎯 Ordine di esecuzione consigliato
1. Frontend responsive + nav ordini + stati (loading/vuoto/errore) + toast (§1).
2. Seed prodotti ricco (§4).
3. Feature core: ricerca, ordinamento, paginazione, quantità, stock UI (§2).
4. Pagine legali + footer + cookie banner (§6).
5. SEO + accessibilità + Lighthouse + analytics (§5).
6. README professionale con screenshot (§9).
7. Admin: upload R2 + gestione ordini (§3) ed email Resend (§7).
8. Robustezza pagamenti + refund (§8).
9. Sentry, test, CI, indici DB (§9).

## ✔️ Definition of Done globale
Da telefono e desktop: flusso completo senza layout rotti e con feedback su ogni azione;
ricerca/filtri/ordinamento/quantità/stock; ogni link del footer (legali inclusi) reale;
acquisto → ordine paid + mail di conferma; pagamento fallito gestito; Lighthouse mobile 90+;
README con screenshot/stack/demo/setup e CI verde.
Nota: "perfetto" non vuol dire "tutti i P2". P0 + P1 ti portano a "professionale senza spigoli".
