import { getCurrentUser } from '@/lib/auth';
import { getLibretto, getCreditDetail } from '@/lib/data/cfp';

export const dynamic = 'force-dynamic';

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="badge success">Adempiente</span>
  ) : (
    <span className="badge warn">In difetto</span>
  );
}

export default async function LibrettoPage() {
  const user = await getCurrentUser();
  const [{ years, trienni }, detail] = await Promise.all([
    getLibretto(user.id),
    getCreditDetail(user.id)
  ]);

  return (
    <div className="stack">
      <div className="row between">
        <div>
          <h1 className="page-title">Libretto formativo</h1>
          <p className="muted">
            Crediti formativi maturati rispetto all&apos;obbligo annuale e di triennio.
          </p>
        </div>
        <a href="/api/libretto/pdf" target="_blank" className="btn primary">
          Scarica libretto (PDF)
        </a>
      </div>

      {/* Triennium summary */}
      {trienni.map((t) => {
        const pct = t.required ? Math.min(100, Math.round((t.earned / t.required) * 100)) : 0;
        return (
          <div className="card stack" key={t.label}>
            <div className="row between">
              <div className="card-title">Triennio {t.label}</div>
              <StatusBadge ok={t.compliant} />
            </div>
            <div className="row between small">
              <span className="muted">Crediti maturati</span>
              <span>
                <strong style={{ fontSize: 22 }}>{t.earned}</strong>{' '}
                <span className="muted">/ {t.required} richiesti</span>
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${pct}%`, background: t.compliant ? 'var(--color-success, #15803d)' : undefined }} />
            </div>
          </div>
        );
      })}

      {/* Per-year */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>
          Obbligo annuale
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Anno</th>
              <th>Maturati</th>
              <th>Richiesti</th>
              <th>Avanzamento</th>
              <th>Stato</th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => {
              const pct = y.requiredAnnual ? Math.min(100, Math.round((y.earned / y.requiredAnnual) * 100)) : 0;
              return (
                <tr key={y.year}>
                  <td>{y.year}</td>
                  <td>
                    <strong>{y.earned}</strong>
                  </td>
                  <td>{y.requiredAnnual}</td>
                  <td style={{ minWidth: 160 }}>
                    <div className="progress">
                      <span style={{ width: `${pct}%`, background: y.compliant ? 'var(--color-success, #15803d)' : undefined }} />
                    </div>
                  </td>
                  <td>
                    <StatusBadge ok={y.compliant} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ledger detail */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>
          Dettaglio movimenti crediti
        </div>
        {detail.length === 0 ? (
          <p className="muted small">Nessun credito maturato.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Attività</th>
                <th>Modalità</th>
                <th>Crediti</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((d, i) => (
                <tr key={i}>
                  <td>{new Date(d.date).toLocaleDateString('it-IT')}</td>
                  <td>{d.content ?? d.reason}</td>
                  <td>{d.mode === 'live' ? 'Live' : 'Differita'}</td>
                  <td>
                    <strong>+{Number(d.credits)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
