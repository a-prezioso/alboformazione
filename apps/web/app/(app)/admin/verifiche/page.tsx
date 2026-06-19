import { db, contents } from '@alboformazione/db';
import { desc, sql } from 'drizzle-orm';
import { getCurrentUser, canViewOps } from '@/lib/auth';
import { AccessDenied } from '@/components/AccessDenied';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function AdminVerifichePage() {
  const me = await getCurrentUser();
  if (!canViewOps(me)) return <AccessDenied message="Le verifiche sono riservate a operatori e amministratori." />;

  const rows = await db
    .select({
      id: contents.id,
      title: contents.title,
      type: contents.contentType,
      certifying: contents.certifying,
      completions: sql<number>`(select count(*)::int from alboformazione.view_progress vp where vp.content_id = alboformazione.contents.id and vp.completed)`,
      attempts: sql<number>`(select count(*)::int from alboformazione.quiz_attempts qa join alboformazione.quizzes q on q.id = qa.quiz_id where q.content_id = alboformazione.contents.id)`,
      passed: sql<number>`(select count(*)::int from alboformazione.quiz_attempts qa join alboformazione.quizzes q on q.id = qa.quiz_id where q.content_id = alboformazione.contents.id and qa.passed)`,
      attendance: sql<number>`(select count(*)::int from alboformazione.live_attendance la join alboformazione.live_events le on le.id = la.live_event_id where le.content_id = alboformazione.contents.id)`,
      certificates: sql<number>`(select count(*)::int from alboformazione.certificates ce where ce.content_id = alboformazione.contents.id)`
    })
    .from(contents)
    .orderBy(desc(contents.updatedAt));

  // Only certifying content is meaningful for "verifiche" (crediti/attestati).
  const certRows = rows.filter((r) => r.certifying);
  const tot = certRows.reduce(
    (a, r) => ({
      completions: a.completions + r.completions,
      attendance: a.attendance + r.attendance,
      attempts: a.attempts + r.attempts,
      passed: a.passed + r.passed,
      certificates: a.certificates + r.certificates
    }),
    { completions: 0, attendance: 0, attempts: 0, passed: 0, certificates: 0 }
  );
  const passRate = tot.attempts > 0 ? Math.round((tot.passed / tot.attempts) * 100) : 0;

  const Kpi = ({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) => (
    <div className="card">
      <div className="muted small">{label}</div>
      <div className="kpi">
        {value}
        {suffix ? <span style={{ fontSize: 16 }}> {suffix}</span> : null}
      </div>
    </div>
  );

  return (
    <div className="stack">
      <PageHeader
        title="Verifiche"
        subtitle="Completamenti, presenze ai live, esiti dei test e attestati rilasciati per contenuto certificante."
      />

      <div className="grid cols-4">
        <Kpi label="Completamenti differita" value={tot.completions} />
        <Kpi label="Presenze live" value={tot.attendance} />
        <Kpi label="Test superati" value={`${tot.passed}/${tot.attempts}`} />
        <Kpi label="Attestati rilasciati" value={tot.certificates} />
      </div>

      {certRows.length === 0 ? (
        <div className="card muted">Nessun contenuto certificante.</div>
      ) : (
        <table className="table card" style={{ padding: 0 }}>
          <thead>
            <tr>
              <th>Contenuto</th>
              <th>Tipo</th>
              <th>Completati</th>
              <th>Presenze live</th>
              <th>Test (superati/tentativi)</th>
              <th>Attestati</th>
            </tr>
          </thead>
          <tbody>
            {certRows.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.type === 'live' ? 'Live' : 'Differita'}</td>
                <td>{r.completions}</td>
                <td>{r.attendance}</td>
                <td>
                  {r.passed}/{r.attempts}
                  {r.attempts > 0 && (
                    <span className="muted small"> ({Math.round((r.passed / r.attempts) * 100)}%)</span>
                  )}
                </td>
                <td>
                  {r.certificates > 0 ? (
                    <span className="badge success">{r.certificates}</span>
                  ) : (
                    <span className="muted">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">Tasso di superamento complessivo dei test: <strong>{passRate}%</strong>.</p>
    </div>
  );
}
