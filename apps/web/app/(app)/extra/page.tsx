import { listExtra } from '@/lib/data/catalog';
import { ContentCard } from '@/components/ContentCard';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

export default async function ExtraPage() {
  const items = await listExtra();
  return (
    <div className="stack">
      <PageHeader
        title="Contenuti extra"
        subtitle="Interviste, registrazioni e contenuti divulgativi. Non rilasciano crediti formativi e sono chiaramente distinti dagli eventi certificanti."
      />
      {items.length === 0 ? (
        <EmptyState
          icon="extra"
          title="Nessun contenuto extra"
          description="Al momento non ci sono interviste o contenuti divulgativi pubblicati."
        />
      ) : (
        <div className="grid cols-3">
          {items.map((c) => (
            <ContentCard key={c.id} content={c} basePath="/extra" />
          ))}
        </div>
      )}
    </div>
  );
}
