import { db, users, memberships, contents, creditLedger, certificates, orders, viewProgress } from '@alboformazione/db';
import { and, eq, sql } from 'drizzle-orm';
import { getCurrentUser, canViewOps } from '@/lib/auth';
import { AccessDenied } from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

function Kpi({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="card">
      <div className="muted small">{label}</div>
      <div className="kpi">
        {value}
        {suffix ? <span style={{ fontSize: 16 }}> {suffix}</span> : null}
      </div>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const me = await getCurrentUser();
  if (!canViewOps(me)) return <AccessDenied message="Le statistiche sono riservate a operatori e amministratori." />;
  const one = async (q: Promise<{ v: string | number }[]>) => Number((await q)[0]?.v ?? 0);

  const [
    totUsers,
    associati,
    publishedContents,
    totalCredits,
    totalCerts,
    revenue,
    vpTotal,
    vpDone
  ] = await Promise.all([
    one(db.select({ v: sql`count(*)::int` }).from(users)),
    one(db.select({ v: sql`count(*)::int` }).from(memberships).where(eq(memberships.status, 'associato'))),
    one(db.select({ v: sql`count(*)::int` }).from(contents).where(eq(contents.status, 'published'))),
    one(db.select({ v: sql`coalesce(sum(${creditLedger.credits}),0)` }).from(creditLedger)),
    one(db.select({ v: sql`count(*)::int` }).from(certificates)),
    one(db.select({ v: sql`coalesce(sum(${orders.total}),0)` }).from(orders).where(eq(orders.status, 'paid'))),
    one(db.select({ v: sql`count(*)::int` }).from(viewProgress)),
    one(db.select({ v: sql`count(*)::int` }).from(viewProgress).where(eq(viewProgress.completed, true)))
  ]);
  const completionRate = vpTotal ? Math.round((vpDone / vpTotal) * 100) : 0;

  // Credits per month (last 8 months)
  const creditsByMonth = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${creditLedger.createdAt}), 'YYYY-MM')`,
      total: sql<string>`sum(${creditLedger.credits})`
    })
    .from(creditLedger)
    .groupBy(sql`date_trunc('month', ${creditLedger.createdAt})`)
    .orderBy(sql`date_trunc('month', ${creditLedger.createdAt})`);
  const recent = creditsByMonth.slice(-8);
  const maxMonth = Math.max(1, ...recent.map((m) => Number(m.total)));

  // Top contents by certificates issued
  const topContents = await db
    .select({
      title: contents.title,
      n: sql<number>`count(${certificates.id})::int`
    })
    .from(certificates)
    .innerJoin(contents, eq(contents.id, certificates.contentId))
    .groupBy(contents.title)
    .orderBy(sql`count(${certificates.id}) desc`)
    .limit(5);
  const maxTop = Math.max(1, ...topContents.map((t) => t.n));

  const nonAssociati = totUsers - associati;

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="muted">Quadro sintetico di iscritti, formazione erogata e ricavi.</p>
      </div>

      <div className="grid cols-4">
        <Kpi label="Iscritti totali" value={totUsers} />
        <Kpi label="Associati" value={associati} />
        <Kpi label="Contenuti pubblicati" value={publishedContents} />
        <Kpi label="Crediti erogati" value={totalCredits} />
        <Kpi label="Attestati rilasciati" value={totalCerts} />
        <Kpi label="Ricavi e-commerce" value={`€ ${revenue.toFixed(2)}`} />
        <Kpi label="Completion rate" value={completionRate} suffix="%" />
        <Kpi label="Non associati" value={nonAssociati} />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>
            Crediti erogati per mese
          </div>
          {recent.length === 0 ? (
            <p className="muted small">Nessun dato.</p>
          ) : (
            <div className="row" style={{ alignItems: 'flex-end', gap: 12, height: 180 }}>
              {recent.map((m) => (
                <div key={m.month} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      height: `${(Number(m.total) / maxMonth) * 150}px`,
                      background: 'var(--color-primary, #bc2c00)',
                      borderRadius: '6px 6px 0 0',
                      minHeight: 4
                    }}
                    title={`${m.total} crediti`}
                  />
                  <div className="muted" style={{ fontSize: 10, marginTop: 6 }}>
                    {m.month.slice(5)}/{m.month.slice(2, 4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>
            Contenuti più certificati
          </div>
          {topContents.length === 0 ? (
            <p className="muted small">Nessun dato.</p>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              {topContents.map((t) => (
                <div key={t.title}>
                  <div className="row between small">
                    <span style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                    <strong>{t.n}</strong>
                  </div>
                  <div className="progress" style={{ marginTop: 4 }}>
                    <span style={{ width: `${(t.n / maxTop) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
