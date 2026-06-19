import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { db, creditLedger, certificates, viewProgress, liveEvents, contents } from '@alboformazione/db';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getLibretto } from '@/lib/data/cfp';
import { listCatalog } from '@/lib/data/catalog';
import { contentAccess } from '@/lib/access';
import { ContentCard } from '@/components/ContentCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const { trienni } = await getLibretto(user.id);
  const triennio = trienni[trienni.length - 1];
  const featured = (await listCatalog()).slice(0, 3);
  const featuredAccess = await Promise.all(featured.map((c) => contentAccess(user, c)));

  const [credits] = await db
    .select({ total: sql<string>`coalesce(sum(${creditLedger.credits}), 0)` })
    .from(creditLedger)
    .where(eq(creditLedger.userId, user.id));

  const [certCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(certificates)
    .where(eq(certificates.userId, user.id));

  const [completed] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(viewProgress)
    .where(and(eq(viewProgress.userId, user.id), eq(viewProgress.completed, true)));

  const upcoming = await db
    .select({
      id: liveEvents.id,
      title: contents.title,
      startAt: liveEvents.startAt,
      slug: contents.slug
    })
    .from(liveEvents)
    .innerJoin(contents, eq(contents.id, liveEvents.contentId))
    .where(and(eq(liveEvents.status, 'scheduled'), gte(liveEvents.startAt, new Date())))
    .orderBy(liveEvents.startAt)
    .limit(3);

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Ciao, {user.displayName.split(' ')[0]}</h1>
        <p className="muted">La tua area riservata: crediti, avanzamento e prossimi appuntamenti.</p>
      </div>

      <div className="grid cols-3">
        <Link href="/libretto" className="card hover kpi-card">
          <div className="muted small">Crediti formativi maturati</div>
          <div className="kpi">{Number(credits?.total ?? 0)}</div>
        </Link>
        <Link href="/i-miei-corsi" className="card hover kpi-card">
          <div className="muted small">Contenuti completati</div>
          <div className="kpi">{completed?.n ?? 0}</div>
        </Link>
        <Link href="/attestati" className="card hover kpi-card">
          <div className="muted small">Attestati disponibili</div>
          <div className="kpi">{certCount?.n ?? 0}</div>
        </Link>
      </div>

      {triennio && (
        <div className="card stack">
          <div className="row between">
            <span className="card-title">Obbligo formativo — triennio {triennio.label}</span>
            <Link href="/libretto" className="btn ghost small">
              Libretto
            </Link>
          </div>
          <div className="row between small">
            <span className="muted">Crediti maturati</span>
            <span>
              <strong style={{ fontSize: 18 }}>{triennio.earned}</strong>{' '}
              <span className="muted">/ {triennio.required}</span>{' '}
              {triennio.compliant ? (
                <span className="badge success">Adempiente</span>
              ) : (
                <span className="badge warn">In corso</span>
              )}
            </span>
          </div>
          <div className="progress">
            <span
              style={{
                width: `${triennio.required ? Math.min(100, Math.round((triennio.earned / triennio.required) * 100)) : 0}%`,
                background: triennio.compliant ? 'var(--color-success, #15803d)' : undefined
              }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <span className="card-title">Prossimi eventi live</span>
          <Link href="/live" className="btn ghost small">
            Vedi tutti
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted">Nessun evento live in programma.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {upcoming.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{new Date(e.startAt).toLocaleString('it-IT')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/live`} className="btn outline small">
                      Dettagli
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {featured.length > 0 && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="row between">
            <span className="card-title">In evidenza</span>
            <Link href="/catalogo" className="btn ghost small">
              Tutto il catalogo
            </Link>
          </div>
          <div className="grid cols-3">
            {featured.map((c, i) => (
              <ContentCard key={c.id} content={c} access={featuredAccess[i]} />
            ))}
          </div>
        </div>
      )}

      <div className="grid cols-3">
        <Link href="/catalogo" className="card hover">
          <div className="card-title">Catalogo</div>
          <p className="muted small">Sfoglia corsi, webinar e percorsi formativi.</p>
        </Link>
        <Link href="/attestati" className="card hover">
          <div className="card-title">Attestati</div>
          <p className="muted small">Scarica i certificati delle attività completate.</p>
        </Link>
        <Link href="/acquisti" className="card hover">
          <div className="card-title">Acquisti</div>
          <p className="muted small">Acquista contenuti e gestisci i tuoi ordini.</p>
        </Link>
      </div>
    </div>
  );
}
