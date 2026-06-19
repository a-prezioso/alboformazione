import { getCurrentUser, canViewOps } from '@/lib/auth';
import { AccessDenied } from '@/components/AccessDenied';

export const dynamic = 'force-dynamic';

const REPORTS = [
  ['partecipazioni', 'Partecipazioni', 'Presenze agli eventi live con minuti e accredito.'],
  ['crediti', 'Crediti formativi', 'Movimenti del registro crediti (live e differita).'],
  ['certificazioni', 'Certificazioni', 'Attestati rilasciati con codice e crediti.']
];

export default async function AdminReportPage() {
  const me = await getCurrentUser();
  if (!canViewOps(me)) return <AccessDenied message="I report sono riservati a operatori e amministratori." />;
  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Report</h1>
        <p className="muted">Esportazione in CSV su partecipazioni, crediti e certificazioni.</p>
      </div>
      <div className="grid cols-3">
        {REPORTS.map(([kind, title, desc]) => (
          <div className="card stack" key={kind}>
            <div className="card-title">{title}</div>
            <p className="muted small">{desc}</p>
            <a className="btn primary" href={`/api/admin/report/${kind}`}>
              Scarica CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
