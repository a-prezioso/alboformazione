import { getCurrentUser } from '@/lib/auth';
import { db, certificates, contents } from '@alboformazione/db';
import { eq, desc } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function AttestatiPage() {
  const user = await getCurrentUser();
  const rows = await db
    .select({
      id: certificates.id,
      serial: certificates.serial,
      credits: certificates.credits,
      issuedAt: certificates.issuedAt,
      title: contents.title
    })
    .from(certificates)
    .innerJoin(contents, eq(contents.id, certificates.contentId))
    .where(eq(certificates.userId, user.id))
    .orderBy(desc(certificates.issuedAt));

  return (
    <div className="stack">
      <PageHeader
        title="Attestati"
        subtitle="Certificati delle attività formative completate, disponibili al download."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="certificate"
          title="Nessun attestato disponibile"
          description="Completa un corso certificante o partecipa a un evento live per ottenere il tuo primo attestato."
          cta={{ href: '/catalogo', label: 'Esplora il catalogo' }}
        />
      ) : (
        <table className="table card" style={{ padding: 0 }}>
          <thead>
            <tr>
              <th>Attività</th>
              <th>Crediti</th>
              <th>Codice</th>
              <th>Data</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{Number(r.credits)}</td>
                <td className="muted small">{r.serial}</td>
                <td>{new Date(r.issuedAt).toLocaleDateString('it-IT')}</td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                    <a
                      className="btn ghost small"
                      href={`/api/certificate/${r.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Anteprima
                    </a>
                    <a className="btn outline small" href={`/api/certificate/${r.id}?download=1`} download>
                      Scarica PDF
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
