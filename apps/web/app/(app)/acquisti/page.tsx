import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { priceForUser } from '@/lib/access';
import { createOrder } from '@/lib/actions/commerce';
import { SubmitButton } from '@/components/SubmitButton';
import { PageHeader } from '@/components/PageHeader';
import { Icon } from '@/components/Icon';
import { db, products, orders, entitlements, contents, paths } from '@alboformazione/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Card = {
  id: string;
  kind: string;
  title: string;
  price: number;
  other: number;
  owned: boolean;
  included: boolean;
  href: string | null;
};

export default async function AcquistiPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const user = await getCurrentUser();

  const catalogue = await db.select().from(products).where(eq(products.active, true));
  const myOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));

  // What the user already has access to (entitlements + membership-included content).
  const ents = await db.select().from(entitlements).where(eq(entitlements.userId, user.id));
  const ownedContent = new Set(ents.filter((e) => e.contentId).map((e) => e.contentId as string));
  const ownedPath = new Set(ents.filter((e) => e.pathId).map((e) => e.pathId as string));

  const contentMap = new Map(
    (await db.select({ id: contents.id, slug: contents.slug, certifying: contents.certifying }).from(contents)).map(
      (c) => [c.id, c]
    )
  );
  const pathMap = new Map((await db.select({ id: paths.id, slug: paths.slug }).from(paths)).map((p) => [p.id, p.slug]));

  const cards: Card[] = catalogue.map((p) => {
    const price = priceForUser(p, user.membership);
    const other = priceForUser(p, user.membership === 'associato' ? 'non_associato' : 'associato');
    const c = p.contentId ? contentMap.get(p.contentId) : null;
    const included = !!(user.membership === 'associato' && p.kind === 'content' && c?.certifying);
    const owned =
      (p.contentId ? ownedContent.has(p.contentId) : false) || (p.pathId ? ownedPath.has(p.pathId) : false);
    const href = c ? `/catalogo/${c.slug}` : p.pathId ? `/percorsi/${pathMap.get(p.pathId)}` : null;
    return { id: p.id, kind: p.kind, title: p.title, price, other, owned, included, href };
  });

  const contentsCards = cards.filter((c) => c.kind !== 'path');
  const pathCards = cards.filter((c) => c.kind === 'path');

  const orderContentSlug = (oid: string) => {
    const e = ents.find((x) => x.orderId === oid && x.contentId);
    return e?.contentId ? contentMap.get(e.contentId)?.slug ?? null : null;
  };

  return (
    <div className="stack">
      <PageHeader
        title="Acquisti"
        subtitle={
          user.membership === 'associato'
            ? 'Come associato hai prezzi riservati e accesso incluso ai contenuti certificanti.'
            : 'Prezzi a listino per il tuo profilo. L’acquisto abilita subito l’accesso al contenuto.'
        }
      />

      {ok && (
        <div className="card success-note">
          <Icon name="check" size={18} /> Pagamento completato. Accesso abilitato.
        </div>
      )}

      <Section title="Contenuti" cards={contentsCards} membership={user.membership} />
      {pathCards.length > 0 && <Section title="Percorsi" cards={pathCards} membership={user.membership} />}

      <div className="card">
        <div className="card-title">I miei ordini</div>
        {myOrders.length === 0 ? (
          <p className="muted small" style={{ marginTop: 8 }}>
            Nessun ordine effettuato.
          </p>
        ) : (
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Ordine</th>
                <th>Totale</th>
                <th>Stato</th>
                <th>Data</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {myOrders.map((o) => {
                const slug = orderContentSlug(o.id);
                return (
                  <tr key={o.id}>
                    <td className="muted small">{o.id.slice(0, 8)}</td>
                    <td>€ {Number(o.total).toFixed(2)}</td>
                    <td>
                      {o.status === 'paid' ? (
                        <span className="badge success">Pagato</span>
                      ) : (
                        <span className="badge warn">In sospeso</span>
                      )}
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString('it-IT')}</td>
                    <td style={{ textAlign: 'right' }}>
                      {o.status !== 'paid' ? (
                        <Link href={`/checkout/${o.id}`} className="btn outline small">
                          Completa
                        </Link>
                      ) : slug ? (
                        <Link href={`/catalogo/${slug}`} className="btn ghost small">
                          Vai al contenuto
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Section({ title, cards, membership }: { title: string; cards: Card[]; membership: string }) {
  if (cards.length === 0) return null;
  return (
    <section className="stack" style={{ gap: 12 }}>
      <h2 style={{ fontSize: 'var(--font-size-heading-sm, 18px)' }}>{title}</h2>
      <div className="grid cols-3">
        {cards.map((c) => {
          const accessible = c.owned || c.included;
          const saving = membership === 'associato' && c.other > c.price ? c.other - c.price : 0;
          return (
            <div className="card stack" key={c.id} style={{ gap: 10 }}>
              <span className="badge">{c.kind === 'path' ? 'Percorso' : 'Contenuto'}</span>
              <div className="card-title" style={{ fontSize: 16 }}>
                {c.title}
              </div>

              {accessible ? (
                <>
                  <span className="badge success" style={{ alignSelf: 'flex-start' }}>
                    <Icon name="check" size={13} /> {c.included ? 'Incluso (associato)' : 'Già acquistato'}
                  </span>
                  {c.href && (
                    <Link href={c.href} className="btn outline block">
                      Vai al contenuto
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <div className="row between" style={{ alignItems: 'baseline' }}>
                    <strong style={{ fontSize: 22 }}>€ {c.price.toFixed(2)}</strong>
                    {c.other > c.price && (
                      <span className="muted small" style={{ textDecoration: 'line-through' }}>
                        € {c.other.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {saving > 0 && <span className="muted small">Risparmi € {saving.toFixed(2)} come associato</span>}
                  <form action={createOrder}>
                    <input type="hidden" name="productId" value={c.id} />
                    <SubmitButton className="btn primary block" pendingLabel="Reindirizzo…">
                      Acquista
                    </SubmitButton>
                  </form>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
