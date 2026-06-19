import Link from 'next/link';
import { db, contents } from '@alboformazione/db';
import { and, desc, eq } from 'drizzle-orm';
import { getCurrentUser, isContentAuthorOnly } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

const statusBadge: Record<string, string> = { published: 'success', draft: '', archived: 'warn' };

export default async function AdminContenutiPage() {
  const me = await getCurrentUser();
  // A formatore (not operatore/admin) only manages their own content.
  const ownOnly = isContentAuthorOnly(me);
  const rows = await db
    .select()
    .from(contents)
    .where(ownOnly ? eq(contents.authorId, me.id) : undefined)
    .orderBy(desc(contents.updatedAt));
  return (
    <div className="stack">
      <PageHeader
        title="Contenuti"
        subtitle={ownOnly ? 'I contenuti di cui sei formatore.' : 'Corsi, webinar, eventi live e contenuti extra.'}
        actions={
          <Link href="/admin/contenuti/nuovo" className="btn primary">
            + Nuovo contenuto
          </Link>
        }
      />
      {rows.length === 0 && (
        <div className="card muted">Nessun contenuto. Crea il primo con «+ Nuovo contenuto».</div>
      )}
      <table className="table card" style={{ padding: 0 }}>
        <thead>
          <tr>
            <th>Titolo</th>
            <th>Tipo</th>
            <th>Crediti</th>
            <th>Stato</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>
                {c.contentType === 'live' ? 'Live' : c.contentType === 'extra' ? 'Extra' : 'Differita'}
                {!c.certifying && c.contentType !== 'extra' ? ' · no crediti' : ''}
              </td>
              <td>{c.certifying ? `${Number(c.creditsLive)} / ${Number(c.creditsOndemand)}` : '—'}</td>
              <td>
                <span className={`badge ${statusBadge[c.status] ?? ''}`}>{c.status}</span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Link href={`/admin/contenuti/${c.id}`} className="btn outline small">
                  Modifica
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
