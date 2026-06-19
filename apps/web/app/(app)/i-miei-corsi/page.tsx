import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { db, contents, viewProgress, entitlements } from '@alboformazione/db';
import { and, eq, desc, isNotNull } from 'drizzle-orm';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';

export const dynamic = 'force-dynamic';

export default async function MyCoursesPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const user = await getCurrentUser();

  const started = await db
    .select({
      id: contents.id,
      slug: contents.slug,
      title: contents.title,
      type: contents.contentType,
      certifying: contents.certifying,
      watchedPct: viewProgress.watchedPct,
      completed: viewProgress.completed,
      minViewPct: contents.minViewPct
    })
    .from(viewProgress)
    .innerJoin(contents, eq(contents.id, viewProgress.contentId))
    .where(eq(viewProgress.userId, user.id))
    .orderBy(desc(viewProgress.updatedAt));

  // Content the user has access to via an explicit entitlement (purchase/grant)
  // but hasn't started yet — so a freshly purchased course shows up here.
  const owned = await db
    .select({ id: contents.id, slug: contents.slug, title: contents.title, type: contents.contentType })
    .from(entitlements)
    .innerJoin(contents, eq(contents.id, entitlements.contentId))
    .where(and(eq(entitlements.userId, user.id), isNotNull(entitlements.contentId), eq(contents.status, 'published')));

  const startedIds = new Set(started.map((r) => r.id));
  const notStarted = owned.filter((c) => !startedIds.has(c.id));

  const empty = started.length === 0 && notStarted.length === 0;

  return (
    <div className="stack">
      <PageHeader title="I miei corsi" subtitle="I contenuti a cui hai accesso: in corso, completati e da iniziare." />

      {ok && (
        <div className="card success-note">
          <Icon name="check" size={18} /> Acquisto completato — il contenuto è ora disponibile qui sotto.
        </div>
      )}

      {empty ? (
        <EmptyState
          icon="my-courses"
          title="Non hai ancora corsi"
          description="Scegli un contenuto dal catalogo e inizia a formarti: qui troverai accesso e avanzamento."
          cta={{ href: '/catalogo', label: 'Vai al catalogo' }}
        />
      ) : (
        <div className="stack">
          {notStarted.length > 0 && (
            <section className="stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 'var(--font-size-heading-sm, 18px)' }}>Da iniziare</h2>
              {notStarted.map((c) => (
                <div key={c.id} className="card row between">
                  <div className="card-title">{c.title}</div>
                  <Link href={`/catalogo/${c.slug}`} className="btn primary small">
                    {c.type === 'live' ? 'Vai all’evento' : 'Inizia'}
                  </Link>
                </div>
              ))}
            </section>
          )}

          {started.length > 0 && (
            <section className="stack" style={{ gap: 10 }}>
              {notStarted.length > 0 && <h2 style={{ fontSize: 'var(--font-size-heading-sm, 18px)' }}>In corso</h2>}
              {started.map((r) => (
                <Link key={r.id} href={`/catalogo/${r.slug}`} className="card hover">
                  <div className="row between">
                    <div className="card-title">{r.title}</div>
                    {r.completed ? (
                      <span className="badge success">Completato</span>
                    ) : (
                      <span className="badge">{r.watchedPct}%</span>
                    )}
                  </div>
                  <div className="progress" style={{ marginTop: 10 }}>
                    <span style={{ width: `${r.watchedPct}%` }} />
                  </div>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
