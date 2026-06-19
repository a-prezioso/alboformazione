import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getPathBySlug } from '@/lib/data/catalog';
import { priceForUser } from '@/lib/access';
import { createOrder } from '@/lib/actions/commerce';
import { SubmitButton } from '@/components/SubmitButton';
import { Breadcrumb } from '@/components/Breadcrumb';
import { db, products, viewProgress } from '@alboformazione/db';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function PercorsoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const data = await getPathBySlug(slug);
  if (!data || data.path.status !== 'published') notFound();
  const { path, items } = data;

  const product = (await db.select().from(products).where(and(eq(products.pathId, path.id), eq(products.active, true))).limit(1))[0];
  const price = product ? priceForUser(product, user.membership) : null;

  // Per-content completion for this user.
  const progress = await db
    .select({ contentId: viewProgress.contentId, completed: viewProgress.completed })
    .from(viewProgress)
    .where(eq(viewProgress.userId, user.id));
  const completedSet = new Set(progress.filter((p) => p.completed).map((p) => p.contentId));
  const done = items.filter((it) => completedSet.has(it.content.id)).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const totalCredits = items.reduce(
    (acc, it) => acc + Number(it.content.contentType === 'live' ? it.content.creditsLive : it.content.creditsOndemand),
    0
  );

  return (
    <div className="stack" style={{ maxWidth: 860 }}>
      <div>
        <Breadcrumb items={[{ label: 'Percorsi', href: '/percorsi' }, { label: path.title }]} />
        <h1 className="page-title" style={{ marginTop: 6 }}>
          {path.title}
        </h1>
        <p className="muted">{path.description}</p>
      </div>

      <div className="card row between">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span className="badge primary">{items.length} contenuti</span>
            <span className="badge success">fino a {totalCredits} crediti</span>
          </div>
          <div className="progress" style={{ marginTop: 12, width: 260 }}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <span className="muted small">
            {done}/{items.length} completati ({pct}%)
          </span>
        </div>
        {price != null && product && (
          <form action={createOrder}>
            <input type="hidden" name="productId" value={product.id} />
            <SubmitButton pendingLabel="Reindirizzo…">Acquista percorso — € {price.toFixed(2)}</SubmitButton>
          </form>
        )}
      </div>

      <div className="stack">
        {items.map((it, i) => (
          <Link key={it.content.id} href={`/catalogo/${it.content.slug}`} className="card hover row between">
            <div className="row" style={{ gap: 12 }}>
              <span
                className="badge"
                style={{
                  background: completedSet.has(it.content.id) ? 'var(--color-success, #15803d)' : undefined,
                  color: completedSet.has(it.content.id) ? '#fff' : undefined
                }}
              >
                {i + 1}
              </span>
              <div>
                <div className="card-title" style={{ fontSize: 15 }}>
                  {it.content.title}
                </div>
                <span className="muted small">
                  {it.content.contentType === 'live' ? 'Live' : 'Differita'} ·{' '}
                  {Number(it.content.contentType === 'live' ? it.content.creditsLive : it.content.creditsOndemand)} crediti
                </span>
              </div>
            </div>
            {completedSet.has(it.content.id) && <span className="badge success">Completato</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
