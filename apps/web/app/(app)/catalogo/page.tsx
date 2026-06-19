import { getCurrentUser } from '@/lib/auth';
import { listCatalog, listCategories, type ContentRow } from '@/lib/data/catalog';
import { contentAccess, type AccessState } from '@/lib/access';
import { ContentCard } from '@/components/ContentCard';
import { CatalogFilters } from '@/components/CatalogFilters';

export const dynamic = 'force-dynamic';

type Item = { content: ContentRow; access: AccessState };

export default async function CatalogoPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; type?: string; category?: string }>;
}) {
  const { q, type, category } = await searchParams;
  const user = await getCurrentUser();
  const [items, categories] = await Promise.all([listCatalog({ q, type, category }), listCategories()]);

  const withAccess: Item[] = await Promise.all(
    items.map(async (c) => ({ content: c, access: await contentAccess(user, c) }))
  );

  const filtered = !!(q || (type && type !== 'all') || (category && category !== 'all'));

  // Group by category when browsing unfiltered.
  const groups = new Map<string, Item[]>();
  for (const it of withAccess) {
    const key = it.content.category ?? 'Altro';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Catalogo formativo</h1>
        <p className="muted">
          {items.length} contenuti.{' '}
          {user.membership === 'associato'
            ? 'Come associato hai accesso incluso ai contenuti certificanti.'
            : 'I prezzi mostrati sono quelli riservati al tuo profilo.'}
        </p>
      </div>

      <CatalogFilters categories={categories} initial={{ q, type, category }} />

      {withAccess.length === 0 ? (
        <div className="card muted">Nessun contenuto trovato con questi criteri.</div>
      ) : filtered ? (
        <div className="grid cols-3">
          {withAccess.map(({ content, access }) => (
            <ContentCard key={content.id} content={content} access={access} />
          ))}
        </div>
      ) : (
        [...groups.entries()].map(([cat, list]) => (
          <section key={cat} className="stack" style={{ gap: 12 }}>
            <div className="row between" style={{ borderBottom: '1px solid var(--color-outline-variant, rgba(0,0,0,0.08))', paddingBottom: 6 }}>
              <h2 style={{ fontSize: 'var(--font-size-heading-sm, 18px)' }}>{cat}</h2>
              <span className="muted small">{list.length} contenuti</span>
            </div>
            <div className="grid cols-3">
              {list.map(({ content, access }) => (
                <ContentCard key={content.id} content={content} access={access} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
