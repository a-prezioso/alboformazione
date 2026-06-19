import Link from 'next/link';
import { listPaths } from '@/lib/data/catalog';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function PercorsiPage() {
  const paths = await listPaths();
  return (
    <div className="stack">
      <PageHeader
        title="Percorsi formativi"
        subtitle="Raccolte tematiche di contenuti, acquistabili come pacchetto."
      />
      {paths.length === 0 ? (
        <EmptyState
          icon="paths"
          title="Nessun percorso disponibile"
          description="I percorsi formativi tematici saranno pubblicati a breve."
          cta={{ href: '/catalogo', label: 'Vai al catalogo' }}
        />
      ) : (
        <div className="grid cols-3">
          {paths.map((p) => (
            <Link key={p.id} href={`/percorsi/${p.slug}`} className="card hover">
              <span className="badge primary">Percorso</span>
              <div className="card-title" style={{ marginTop: 10 }}>
                {p.title}
              </div>
              <p className="muted small" style={{ marginTop: 8, minHeight: 40 }}>
                {p.description}
              </p>
              <span className="muted small">{p.items} contenuti</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
