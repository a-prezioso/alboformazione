/**
 * Rich demo seed for Albo Formazione — idempotent.
 * Populates a realistic catalog (multiple categories, live + on-demand + extra),
 * past/future live events, products, learning paths, and PRE-EARNED activity
 * (progress, multi-year credits, certificates, orders, attendance, notifications)
 * so dashboards, libretto and analytics are populated out of the box.
 */
import { getSql } from './_sql';

async function main() {
  const sql = await getSql();
  const s = 'alboformazione';
  const S = sql(s);

  // ── Users ──────────────────────────────────────────────────────────────────
  const users: Array<[string, string, boolean]> = [
    ['mario.rossi@demo.it', 'Mario Rossi', false],
    ['giulia.verdi@demo.it', 'Giulia Verdi', false],
    ['prof.bianchi@demo.it', 'Prof. Bianchi', false],
    ['operatore@demo.it', 'Operatore Segreteria', false],
    ['luca.neri@demo.it', 'Luca Neri', false],
    ['sara.gallo@demo.it', 'Sara Gallo', false],
    ['anna.ferri@demo.it', 'Anna Ferri', false],
    ['admin@demo.it', 'Amministratore Demo', true],
    ['a.prezioso@elitesoftwarehouse.com', 'Alex Prezioso', true]
  ];
  for (const [email, name, admin] of users) {
    await sql`INSERT INTO ${S}.users (email, display_name, is_super_admin)
      VALUES (${email}, ${name}, ${admin})
      ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name`;
  }
  const idOf = async (email: string) =>
    (await sql`SELECT id FROM ${S}.users WHERE email = ${email}`)[0].id as string;

  const U: Record<string, string> = {};
  for (const [email] of users) U[email] = await idOf(email);

  // ── Memberships ──────────────────────────────────────────────────────────────
  const memberships: Array<[string, string]> = [
    ['mario.rossi@demo.it', 'associato'],
    ['giulia.verdi@demo.it', 'non_associato'],
    ['prof.bianchi@demo.it', 'associato'],
    ['operatore@demo.it', 'associato'],
    ['luca.neri@demo.it', 'associato'],
    ['sara.gallo@demo.it', 'non_associato'],
    ['anna.ferri@demo.it', 'associato'],
    ['admin@demo.it', 'associato'],
    ['a.prezioso@elitesoftwarehouse.com', 'associato']
  ];
  for (const [email, status] of memberships) {
    await sql`INSERT INTO ${S}.memberships (user_id, status, valid_from, valid_to)
      VALUES (${U[email]}, ${status}, '2024-01-01', '2026-12-31')
      ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status`;
  }

  // ── Member details (anagrafica) ───────────────────────────────────────────────
  const details: Array<[string, string, string, string, string]> = [
    ['mario.rossi@demo.it', 'RSSMRA80A01H501U', 'Avvocato', 'ORD-AV-1287', 'Roma'],
    ['luca.neri@demo.it', 'NRELCU75B12F205K', 'Commercialista', 'ODCEC-4421', 'Milano'],
    ['anna.ferri@demo.it', 'FRRNNA82C45L219Z', 'Ingegnere', 'ORDING-9087', 'Torino'],
    ['prof.bianchi@demo.it', 'BNCGNN60D10F839T', 'Avvocato', 'ORD-AV-0042', 'Napoli']
  ];
  for (const [email, cf, prof, reg, city] of details) {
    await sql`INSERT INTO ${S}.member_details (user_id, fiscal_code, profession, registration_number, city)
      VALUES (${U[email]}, ${cf}, ${prof}, ${reg}, ${city})
      ON CONFLICT (user_id) DO UPDATE SET fiscal_code = EXCLUDED.fiscal_code, profession = EXCLUDED.profession,
        registration_number = EXCLUDED.registration_number, city = EXCLUDED.city`;
  }

  // ── Roles ──────────────────────────────────────────────────────────────────────
  const roleId = async (slug: string) =>
    (await sql`SELECT id FROM ${S}.roles WHERE slug = ${slug}`)[0].id as number;
  const assign = async (email: string, slug: string) => {
    const rid = await roleId(slug);
    await sql`INSERT INTO ${S}.user_roles (user_id, role_id) VALUES (${U[email]}, ${rid}) ON CONFLICT DO NOTHING`;
  };
  await assign('mario.rossi@demo.it', 'member');
  await assign('giulia.verdi@demo.it', 'member');
  await assign('luca.neri@demo.it', 'member');
  await assign('sara.gallo@demo.it', 'member');
  await assign('anna.ferri@demo.it', 'member');
  await assign('prof.bianchi@demo.it', 'member');
  await assign('prof.bianchi@demo.it', 'formatore');
  await assign('operatore@demo.it', 'operatore');
  await assign('admin@demo.it', 'admin');
  await assign('a.prezioso@elitesoftwarehouse.com', 'admin');

  // ── Catalog ──────────────────────────────────────────────────────────────────
  const VIDEO = 'https://storage.googleapis.com/elite-public-demo/sample-60s.mp4';
  type C = {
    slug: string; title: string; type: 'live' | 'ondemand' | 'extra'; category?: string; level?: string;
    certifying: boolean; cl?: number; co?: number; min?: number; dur?: number; summary: string;
    extraKind?: string; status?: string; activeFrom?: string | null;
  };
  const contents: C[] = [
    { slug: 'webinar-deontologia-2026', title: 'Webinar — Deontologia professionale 2026', type: 'live', category: 'Deontologia', level: 'base', certifying: true, cl: 2, co: 1.5, min: 80, dur: 90, summary: 'Evento live con rilascio crediti in misura piena.' },
    { slug: 'corso-aggiornamento-normativo', title: 'Aggiornamento normativo (differita)', type: 'ondemand', category: 'Aggiornamento normativo', level: 'base', certifying: true, co: 1.5, min: 80, dur: 60, summary: 'Corso on-demand con test di sblocco e crediti ridotti.' },
    { slug: 'intervista-presidente', title: 'Intervista al Presidente dell’Associazione', type: 'extra', category: 'Divulgazione', certifying: false, summary: 'Contenuto divulgativo — non rilascia crediti.', extraKind: 'intervista' },
    { slug: 'deontologia-casi-pratici', title: 'Deontologia: casi pratici e responsabilità', type: 'ondemand', category: 'Deontologia', level: 'intermedio', certifying: true, co: 2, min: 80, dur: 75, summary: 'Analisi di casi reali e profili di responsabilità disciplinare.' },
    { slug: 'fiscale-novita-2026', title: 'Novità fiscali e tributarie 2026', type: 'ondemand', category: 'Fiscale e tributario', level: 'intermedio', certifying: true, co: 3, min: 80, dur: 120, summary: 'Le principali novità della legge di bilancio per i professionisti.' },
    { slug: 'fiscale-iva-internazionale', title: 'IVA nelle operazioni internazionali', type: 'ondemand', category: 'Fiscale e tributario', level: 'avanzato', certifying: true, co: 2.5, min: 80, dur: 100, summary: 'Reverse charge, plafond e adempimenti per l’estero.' },
    { slug: 'privacy-gdpr-studio', title: 'GDPR per lo studio professionale', type: 'ondemand', category: 'Privacy & GDPR', level: 'base', certifying: true, co: 2, min: 80, dur: 80, summary: 'Adempimenti privacy concreti per lo studio.' },
    { slug: 'sicurezza-luoghi-lavoro', title: 'Sicurezza nei luoghi di lavoro — aggiornamento', type: 'ondemand', category: 'Sicurezza', level: 'base', certifying: true, co: 1.5, min: 80, dur: 70, summary: 'Aggiornamento obbligatorio D.Lgs. 81/08.' },
    { slug: 'soft-skills-comunicazione', title: 'Comunicazione efficace con il cliente', type: 'ondemand', category: 'Soft skills', level: 'base', certifying: true, co: 1, min: 70, dur: 45, summary: 'Tecniche di comunicazione e gestione del colloquio.' },
    { slug: 'tecnico-processo-telematico', title: 'Processo civile telematico: deposito e firme', type: 'ondemand', category: 'Tecnico-professionale', level: 'intermedio', certifying: true, co: 2, min: 80, dur: 90, summary: 'PCT, firme digitali e deposito atti.' },
    { slug: 'webinar-riforma-processo', title: 'Webinar — Riforma del processo civile', type: 'live', category: 'Aggiornamento normativo', level: 'intermedio', certifying: true, cl: 3, co: 2, min: 80, dur: 120, summary: 'Diretta con dibattito sulle novità procedurali.' },
    { slug: 'webinar-antiriciclaggio', title: 'Webinar — Antiriciclaggio per professionisti', type: 'live', category: 'Aggiornamento normativo', level: 'avanzato', certifying: true, cl: 2, co: 1.5, min: 80, dur: 90, summary: 'Obblighi di adeguata verifica e segnalazione.' },
    { slug: 'fiscale-dichiarazioni', title: 'Dichiarazioni dei redditi 2026: novità operative', type: 'ondemand', category: 'Fiscale e tributario', level: 'base', certifying: true, co: 2, min: 80, dur: 95, summary: 'Quadri, crediti d’imposta e scadenze.' },
    { slug: 'privacy-data-breach', title: 'Gestione del data breach', type: 'ondemand', category: 'Privacy & GDPR', level: 'avanzato', certifying: true, co: 1.5, min: 80, dur: 60, summary: 'Procedura, notifica al Garante e registro.' },
    { slug: 'soft-skills-time-management', title: 'Time management per lo studio', type: 'ondemand', category: 'Soft skills', level: 'base', certifying: false, co: 0, min: 70, dur: 40, summary: 'Organizzazione del lavoro e priorità (non certificante).' },
    { slug: 'tavola-rotonda-futuro-professione', title: 'Tavola rotonda: il futuro della professione', type: 'extra', category: 'Divulgazione', certifying: false, summary: 'Confronto tra esperti — contenuto extra.', extraKind: 'registrazione' },
    { slug: 'pillola-ai-professione', title: 'Pillola: l’AI nello studio professionale', type: 'extra', category: 'Divulgazione', certifying: false, summary: 'Breve contenuto divulgativo sull’AI.', extraKind: 'divulgativo' },
    { slug: 'webinar-etica-ai', title: 'Webinar — Etica e AI nella professione', type: 'live', category: 'Soft skills', level: 'base', certifying: true, cl: 1.5, co: 1, min: 80, dur: 60, summary: 'Diretta sull’uso responsabile dell’AI.' }
  ];

  const cid: Record<string, string> = {};
  const prof = U['prof.bianchi@demo.it'];
  const adminAuthor = U['admin@demo.it'];
  // Distribute authorship so the formatore-scoped content view is demonstrable:
  // the formatore (Bianchi) authors his subject areas; the rest is admin-authored.
  const profCategories = new Set(['Deontologia', 'Soft skills', 'Divulgazione']);
  for (const c of contents) {
    const authorId = c.category && profCategories.has(c.category) ? prof : adminAuthor;
    const row: Record<string, unknown> = {
      slug: c.slug, title: c.title, summary: c.summary,
      description: `${c.summary}\n\nContenuto formativo dell'Associazione Professionale.`,
      content_type: c.type, certifying: c.certifying,
      credits_live: String(c.cl ?? 0), credits_ondemand: String(c.co ?? 0),
      min_view_pct: c.min ?? 80, duration_min: c.dur ?? null,
      category: c.category ?? null, level: c.level ?? null,
      extra_kind: c.extraKind ?? null, status: c.status ?? 'published',
      credits_active_from: c.certifying ? (c.activeFrom ?? '2024-01-01T00:00:00Z') : null,
      video_key: c.type === 'live' ? null : VIDEO, author_id: authorId
    };
    await sql`INSERT INTO ${S}.contents ${sql(row as never)}
      ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary,
        category = EXCLUDED.category, level = EXCLUDED.level, content_type = EXCLUDED.content_type,
        certifying = EXCLUDED.certifying, credits_live = EXCLUDED.credits_live,
        credits_ondemand = EXCLUDED.credits_ondemand, status = EXCLUDED.status,
        credits_active_from = EXCLUDED.credits_active_from, author_id = EXCLUDED.author_id`;
    cid[c.slug] = (await sql`SELECT id FROM ${S}.contents WHERE slug = ${c.slug}`)[0].id as string;
  }

  // ── Quizzes for certifying on-demand content ──────────────────────────────────
  for (const c of contents) {
    if (c.type !== 'ondemand' || !c.certifying) continue;
    await sql`INSERT INTO ${S}.quizzes (content_id, pass_pct, active) VALUES (${cid[c.slug]}, 60, true)
      ON CONFLICT (content_id) DO UPDATE SET pass_pct = 60, active = true`;
    const quizId = (await sql`SELECT id FROM ${S}.quizzes WHERE content_id = ${cid[c.slug]}`)[0].id as string;
    const qs = [
      [`Qual è l'argomento principale di "${c.title}"?`, JSON.stringify([c.category ?? 'Generale', 'Nessuno', 'Altro']), 0],
      ['Quale percentuale minima di visione è richiesta?', JSON.stringify(['50%', `${c.min ?? 80}%`, '100%']), 1],
      ['Il test di sblocco è accessibile…', JSON.stringify(['Subito', 'Dopo la soglia minima di visione', 'Mai']), 1]
    ];
    for (let i = 0; i < qs.length; i++) {
      const [prompt, options, correct] = qs[i]!;
      await sql`INSERT INTO ${S}.quiz_questions (quiz_id, prompt, options, correct_index, position)
        SELECT ${quizId}, ${prompt as string}, ${options as string}::jsonb, ${correct as number}, ${i}
        WHERE NOT EXISTS (SELECT 1 FROM ${S}.quiz_questions WHERE quiz_id = ${quizId} AND position = ${i})`;
    }
  }

  // ── Live events (past + future) ────────────────────────────────────────────────
  const liveDefs: Array<[string, string, string, string, string | null]> = [
    // slug, startAt, status, joinUrl, recordingKey
    ['webinar-deontologia-2026', '2026-07-15T17:00:00Z', 'scheduled', 'https://us02web.zoom.us/j/MOCK-DEONTO-2026', null],
    ['webinar-riforma-processo', '2026-09-20T16:00:00Z', 'scheduled', 'https://us02web.zoom.us/j/MOCK-RIFORMA', null],
    ['webinar-antiriciclaggio', '2025-11-12T16:30:00Z', 'ended', 'https://us02web.zoom.us/j/MOCK-AML', 'https://us02web.zoom.us/rec/MOCK-AML'],
    ['webinar-etica-ai', '2026-03-05T17:30:00Z', 'ended', 'https://us02web.zoom.us/j/MOCK-ETICA', 'https://us02web.zoom.us/rec/MOCK-ETICA']
  ];
  const eid: Record<string, string> = {};
  for (const [slug, start, status, join, rec] of liveDefs) {
    await sql`INSERT INTO ${S}.live_events (content_id, zoom_meeting_id, join_url, start_at, end_at, status, recording_key)
      SELECT ${cid[slug]}, ${join.split('/').pop()}, ${join}, ${start}::timestamptz,
             ${start}::timestamptz + interval '90 minutes', ${status}, ${rec}
      WHERE NOT EXISTS (SELECT 1 FROM ${S}.live_events WHERE content_id = ${cid[slug]})`;
    eid[slug] = (await sql`SELECT id FROM ${S}.live_events WHERE content_id = ${cid[slug]} ORDER BY start_at LIMIT 1`)[0].id as string;
  }

  // ── Materials ────────────────────────────────────────────────────────────────
  for (const slug of ['corso-aggiornamento-normativo', 'fiscale-novita-2026', 'privacy-gdpr-studio']) {
    await sql`INSERT INTO ${S}.content_materials (content_id, title, file_key, kind)
      SELECT ${cid[slug]}, 'Slide del corso', ${'demo/slide-' + slug + '.pdf'}, 'slide'
      WHERE NOT EXISTS (SELECT 1 FROM ${S}.content_materials WHERE content_id = ${cid[slug]})`;
  }

  // ── Paths ──────────────────────────────────────────────────────────────────────
  const pathDefs: Array<[string, string, string, string[]]> = [
    ['percorso-aggiornamento-2026', 'Percorso Aggiornamento 2026', 'Webinar e corsi dell’anno.', ['webinar-deontologia-2026', 'corso-aggiornamento-normativo', 'webinar-riforma-processo']],
    ['percorso-fiscale', 'Percorso Fiscale e Tributario', 'Specializzazione in materia fiscale.', ['fiscale-novita-2026', 'fiscale-iva-internazionale', 'fiscale-dichiarazioni']],
    ['percorso-privacy', 'Percorso Privacy & GDPR', 'Compliance privacy per lo studio.', ['privacy-gdpr-studio', 'privacy-data-breach']]
  ];
  const pid: Record<string, string> = {};
  for (const [slug, title, desc, items] of pathDefs) {
    await sql`INSERT INTO ${S}.paths (slug, title, description, status) VALUES (${slug}, ${title}, ${desc}, 'published')
      ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title`;
    pid[slug] = (await sql`SELECT id FROM ${S}.paths WHERE slug = ${slug}`)[0].id as string;
    for (let i = 0; i < items.length; i++) {
      await sql`INSERT INTO ${S}.path_items (path_id, content_id, position) VALUES (${pid[slug]}, ${cid[items[i]!]}, ${i})
        ON CONFLICT DO NOTHING`;
    }
  }

  // ── Products (differentiated pricing) ──────────────────────────────────────────
  const productDefs: Array<[string, 'content' | 'path', string, string, number, number]> = [
    ['prod-corso-aggiornamento', 'content', 'corso-aggiornamento-normativo', 'Aggiornamento normativo', 30, 50],
    ['prod-fiscale-novita', 'content', 'fiscale-novita-2026', 'Novità fiscali 2026', 40, 70],
    ['prod-fiscale-iva', 'content', 'fiscale-iva-internazionale', 'IVA internazionale', 35, 60],
    ['prod-privacy-gdpr', 'content', 'privacy-gdpr-studio', 'GDPR per lo studio', 30, 55],
    ['prod-sicurezza', 'content', 'sicurezza-luoghi-lavoro', 'Sicurezza sul lavoro', 25, 45],
    ['prod-pct', 'content', 'tecnico-processo-telematico', 'Processo civile telematico', 30, 55],
    ['prod-webinar-deontologia', 'content', 'webinar-deontologia-2026', 'Webinar Deontologia 2026', 20, 40],
    ['prod-deontologia-casi', 'content', 'deontologia-casi-pratici', 'Deontologia: casi pratici', 30, 50],
    ['prod-soft-comunicazione', 'content', 'soft-skills-comunicazione', 'Comunicazione efficace', 15, 30],
    ['prod-webinar-riforma', 'content', 'webinar-riforma-processo', 'Webinar Riforma processo civile', 25, 45],
    ['prod-webinar-antiriciclaggio', 'content', 'webinar-antiriciclaggio', 'Webinar Antiriciclaggio', 20, 40],
    ['prod-fiscale-dichiarazioni', 'content', 'fiscale-dichiarazioni', 'Dichiarazioni dei redditi 2026', 30, 55],
    ['prod-privacy-databreach', 'content', 'privacy-data-breach', 'Gestione del data breach', 20, 40],
    ['prod-webinar-etica-ai', 'content', 'webinar-etica-ai', 'Webinar Etica e AI', 20, 35],
    ['prod-percorso-2026', 'path', 'percorso-aggiornamento-2026', 'Percorso Aggiornamento 2026', 60, 110],
    ['prod-percorso-fiscale', 'path', 'percorso-fiscale', 'Percorso Fiscale e Tributario', 80, 150],
    ['prod-percorso-privacy', 'path', 'percorso-privacy', 'Percorso Privacy & GDPR', 50, 90]
  ];
  for (const [slug, kind, ref, title, pm, pn] of productDefs) {
    const row: Record<string, unknown> = {
      slug, kind, title, price_member: String(pm), price_non_member: String(pn),
      content_id: kind === 'content' ? cid[ref] : null,
      path_id: kind === 'path' ? pid[ref] : null
    };
    await sql`INSERT INTO ${S}.products ${sql(row as never)}
      ON CONFLICT (slug) DO UPDATE SET price_member = EXCLUDED.price_member, price_non_member = EXCLUDED.price_non_member, title = EXCLUDED.title`;
  }

  // ── Pre-earned activity (idempotent) ────────────────────────────────────────────
  let certSeq = 1000;
  const grant = async (email: string, slug: string, mode: 'live' | 'ondemand', credits: number, whenISO: string) => {
    const uid = U[email], contentId = cid[slug];
    // progress (on-demand)
    if (mode === 'ondemand') {
      await sql`INSERT INTO ${S}.view_progress (user_id, content_id, watched_pct, last_position_sec, completed, updated_at)
        VALUES (${uid}, ${contentId}, 100, 0, true, ${whenISO}::timestamptz)
        ON CONFLICT (user_id, content_id) DO UPDATE SET watched_pct = 100, completed = true`;
    }
    // credit ledger (guarded)
    await sql`INSERT INTO ${S}.credit_ledger (user_id, content_id, mode, credits, reason, created_at)
      SELECT ${uid}, ${contentId}, ${mode}, ${String(credits)}, ${mode === 'live' ? 'Partecipazione evento live' : 'Completamento differita + test'}, ${whenISO}::timestamptz
      WHERE NOT EXISTS (SELECT 1 FROM ${S}.credit_ledger WHERE user_id = ${uid} AND content_id = ${contentId} AND mode = ${mode})`;
    // certificate
    certSeq += 1;
    await sql`INSERT INTO ${S}.certificates (user_id, content_id, credits, serial, issued_at)
      VALUES (${uid}, ${contentId}, ${String(credits)}, ${'AF-SEED-' + certSeq}, ${whenISO}::timestamptz)
      ON CONFLICT (user_id, content_id) DO NOTHING`;
  };

  // Mario (associato) — multi-year history
  await grant('mario.rossi@demo.it', 'fiscale-novita-2026', 'ondemand', 3, '2026-02-10T10:00:00Z');
  await grant('mario.rossi@demo.it', 'privacy-gdpr-studio', 'ondemand', 2, '2026-03-15T10:00:00Z');
  await grant('mario.rossi@demo.it', 'webinar-antiriciclaggio', 'live', 2, '2025-11-12T17:00:00Z');
  await grant('mario.rossi@demo.it', 'deontologia-casi-pratici', 'ondemand', 2, '2025-05-20T10:00:00Z');
  await grant('mario.rossi@demo.it', 'sicurezza-luoghi-lavoro', 'ondemand', 1.5, '2026-01-08T10:00:00Z');
  // Luca (associato)
  await grant('luca.neri@demo.it', 'fiscale-iva-internazionale', 'ondemand', 2.5, '2026-04-02T10:00:00Z');
  await grant('luca.neri@demo.it', 'webinar-etica-ai', 'live', 1.5, '2026-03-05T18:00:00Z');
  await grant('luca.neri@demo.it', 'fiscale-dichiarazioni', 'ondemand', 2, '2026-05-11T10:00:00Z');
  // Anna (associato)
  await grant('anna.ferri@demo.it', 'tecnico-processo-telematico', 'ondemand', 2, '2026-02-22T10:00:00Z');
  await grant('anna.ferri@demo.it', 'webinar-antiriciclaggio', 'live', 2, '2025-11-12T17:00:00Z');

  // Live attendance for past events (credited)
  const attend = async (email: string, slug: string) => {
    await sql`INSERT INTO ${S}.live_attendance (live_event_id, user_id, joined_at, left_at, minutes, credited)
      VALUES (${eid[slug]}, ${U[email]}, now(), now(), 90, true) ON CONFLICT (live_event_id, user_id) DO NOTHING`;
  };
  await attend('mario.rossi@demo.it', 'webinar-antiriciclaggio');
  await attend('anna.ferri@demo.it', 'webinar-antiriciclaggio');
  await attend('luca.neri@demo.it', 'webinar-etica-ai');

  // ── Orders + entitlements (giulia & sara, non associati) ────────────────────────
  const buy = async (email: string, prodSlug: string, contentSlug: string, price: number, whenISO: string) => {
    const uid = U[email];
    const exists = await sql`SELECT o.id FROM ${S}.orders o JOIN ${S}.order_items oi ON oi.order_id = o.id
      JOIN ${S}.products p ON p.id = oi.product_id WHERE o.user_id = ${uid} AND p.slug = ${prodSlug} LIMIT 1`;
    if (exists.length > 0) return;
    const order = (await sql`INSERT INTO ${S}.orders (user_id, status, total, created_at, paid_at)
      VALUES (${uid}, 'paid', ${String(price)}, ${whenISO}::timestamptz, ${whenISO}::timestamptz) RETURNING id`)[0];
    const product = (await sql`SELECT id FROM ${S}.products WHERE slug = ${prodSlug}`)[0];
    await sql`INSERT INTO ${S}.order_items (order_id, product_id, unit_price, qty) VALUES (${order.id}, ${product.id}, ${String(price)}, 1)`;
    await sql`INSERT INTO ${S}.entitlements (user_id, content_id, source, order_id) VALUES (${uid}, ${cid[contentSlug]}, 'purchase', ${order.id}) ON CONFLICT DO NOTHING`;
  };
  await buy('giulia.verdi@demo.it', 'prod-corso-aggiornamento', 'corso-aggiornamento-normativo', 50, '2026-04-18T09:00:00Z');
  await buy('giulia.verdi@demo.it', 'prod-privacy-gdpr', 'privacy-gdpr-studio', 55, '2026-05-02T09:00:00Z');
  await buy('sara.gallo@demo.it', 'prod-fiscale-novita', 'fiscale-novita-2026', 70, '2026-05-09T09:00:00Z');
  // Giulia completed the purchased course (credits despite non-associato, via purchase access)
  await grant('giulia.verdi@demo.it', 'corso-aggiornamento-normativo', 'ondemand', 1.5, '2026-04-20T10:00:00Z');

  // ── Notifications ────────────────────────────────────────────────────────────
  const notify = async (email: string, type: string, title: string, body: string, link: string, read: boolean, whenISO: string) => {
    const uid = U[email];
    await sql`INSERT INTO ${S}.notifications (user_id, type, title, body, link, read, created_at)
      SELECT ${uid}, ${type}, ${title}, ${body}, ${link}, ${read}, ${whenISO}::timestamptz
      WHERE NOT EXISTS (SELECT 1 FROM ${S}.notifications WHERE user_id = ${uid} AND title = ${title})`;
  };
  await notify('mario.rossi@demo.it', 'attestato', 'Attestato disponibile', 'Hai ottenuto l’attestato per "Novità fiscali 2026".', '/attestati', true, '2026-02-10T10:05:00Z');
  await notify('mario.rossi@demo.it', 'evento', 'Promemoria evento live', 'Il webinar "Deontologia professionale 2026" inizia il 15/07.', '/live', false, '2026-06-14T09:00:00Z');
  await notify('mario.rossi@demo.it', 'cfp', 'Obbligo formativo', 'Hai maturato crediti utili al triennio 2024-2026. Controlla il libretto.', '/libretto', false, '2026-06-01T09:00:00Z');
  await notify('giulia.verdi@demo.it', 'acquisto', 'Acquisto completato', 'Hai acquistato "Aggiornamento normativo". Buona formazione!', '/i-miei-corsi', true, '2026-04-18T09:01:00Z');
  await notify('luca.neri@demo.it', 'attestato', 'Attestato disponibile', 'Attestato per "IVA internazionale" pronto al download.', '/attestati', false, '2026-04-02T10:05:00Z');

  await sql.end({ timeout: 5 });
  console.log('rich seed done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
