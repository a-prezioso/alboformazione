# Albo Formazione

LMS white-label per Associazioni Professionali. Eroga formazione **Live**
(videoconferenza) e **Differita** (on-demand con tracciamento della visione),
con crediti formativi differenziati, test di sblocco, attestati con verifica
pubblica, e-commerce e un backoffice completo.

## Avvio in locale

Requisiti: **Node.js ≥ 22** e **pnpm 10** (`npm i -g pnpm`).

Nessuna configurazione necessaria: in locale l'app usa un **database Postgres
embedded** (in-process) che viene creato, migrato e popolato con dati demo
automaticamente al primo avvio. Non servono Docker né un server di database.

```bash
pnpm install
pnpm dev
```

Apri **http://localhost:3000**. Tramite il selettore profilo (demo) puoi
impersonare i diversi ruoli: **associato**, **non associato**, **formatore**,
**operatore**, **admin**. I dati demo (catalogo, eventi live, crediti,
attestati, ordini) sono già popolati.

I dati locali vivono nella cartella `./.localdb`. Comandi utili:

```bash
pnpm setup:local   # (ri)crea il database locale + dati demo
pnpm db:migrate    # applica solo le migrazioni
pnpm db:seed       # ricarica i dati demo
pnpm build         # build di produzione (Next.js)
```

Per usare un Postgres reale invece del database embedded, imposta
`DATABASE_URL` in un file `.env.local` (vedi `.env.example`).

## Struttura

```
apps/web/            # Next.js 15 (App Router) — applicazione utente + backoffice /admin
packages/
  db/                # Drizzle ORM + migrazioni + seed (schema "alboformazione")
  config/            # validazione env (zod)
  ai/                # client per la generazione assistita delle domande dei quiz
  adapters/          # SSO, videoconferenza, pagamenti, SCORM, attestati (mock/sandbox nel POC)
vendor/@esh/         # design system (componenti UI, token, icone)
```

## Stack

- Monorepo **pnpm** + **turbo**
- **Next.js 15** (App Router, React 19) + **Drizzle ORM** (Postgres)
- Database locale embedded (PGlite) / Postgres in produzione
- Design system a componenti (`@esh/*`)

## Adapter

Le integrazioni esterne sono astratte dietro adapter, con implementazioni
mock/sandbox per il POC e i punti di innesto per la produzione:

| Adapter | Mock (POC) | Produzione |
|---|---|---|
| SSO | utenti demo + selettore profilo | SSO del sito istituzionale dell'Associazione |
| Videoconferenza | join URL + presenze simulate | provider live (es. Zoom) |
| Pagamenti | checkout simulato | gateway pagamenti (es. Stripe) |
| SCORM | tracciamento % via heartbeat | runtime SCORM completo |
| Attestati | PDF generato (pdf-lib) | invariato |
