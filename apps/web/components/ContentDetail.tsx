import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getContentBySlug, getMaterials, getProgress, getLiveEvent, getQuiz } from '@/lib/data/catalog';
import { canAccessContent, productForContent, priceForUser } from '@/lib/access';
import { createOrder } from '@/lib/actions/commerce';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SubmitButton } from '@/components/SubmitButton';
import { Breadcrumb, type Crumb } from '@/components/Breadcrumb';
import { Icon } from '@/components/Icon';

/** Shared content detail, used by both /catalogo/[slug] and /extra/[slug].
 * `section` drives the breadcrumb/back context so extra content keeps the
 * "Contenuti extra" context instead of sending the user to the catalog. */
export async function ContentDetail({
  slug,
  ok,
  section = 'catalogo'
}: {
  slug: string;
  ok?: boolean;
  section?: 'catalogo' | 'extra';
}) {
  const user = await getCurrentUser();
  const content = await getContentBySlug(slug);
  if (!content || content.status !== 'published') notFound();

  const [materials, progress, hasAccess, quiz] = await Promise.all([
    getMaterials(content.id),
    getProgress(user.id, content.id),
    canAccessContent(user, content),
    getQuiz(content.id)
  ]);
  const isLive = content.contentType === 'live';
  const liveEvent = isLive ? await getLiveEvent(content.id) : null;
  const product = await productForContent(content.id);
  const price = product ? priceForUser(product, user.membership) : null;

  const credits = isLive ? Number(content.creditsLive) : Number(content.creditsOndemand);
  const watchedPct = progress?.watchedPct ?? 0;
  const completed = progress?.completed ?? false;

  const crumbs: Crumb[] =
    section === 'extra'
      ? [{ label: 'Contenuti extra', href: '/extra' }, { label: content.title }]
      : [
          { label: 'Catalogo', href: '/catalogo' },
          ...(content.category ? [{ label: content.category }] : []),
          { label: content.title }
        ];

  return (
    <div className="stack narrow">
      <div>
        <Breadcrumb items={crumbs} />
        <div className="row" style={{ marginTop: 8, marginBottom: 6 }}>
          {isLive ? (
            <span className="badge live">Live</span>
          ) : content.contentType === 'extra' ? (
            <span className="badge extra">Extra</span>
          ) : (
            <span className="badge">Differita</span>
          )}
          {content.category && <span className="badge">{content.category}</span>}
        </div>
        <h1 className="page-title">{content.title}</h1>
        {content.summary && <p className="muted">{content.summary}</p>}
      </div>

      {ok && hasAccess && (
        <div className="card success-note">
          <Icon name="check" size={18} /> Acquisto completato — hai ora accesso a questo contenuto.
        </div>
      )}

      <div className="detail-grid">
        {/* ── Left: main content ── */}
        <div className="stack">
          {isLive ? (
            <div className="card stack">
              <div className="card-title">Evento live</div>
              {liveEvent ? (
                <>
                  <p>
                    <strong>Inizio:</strong> {new Date(liveEvent.startAt).toLocaleString('it-IT')}
                  </p>
                  <p className="muted small">
                    La partecipazione all&apos;evento live riconosce {Number(content.creditsLive)} crediti in
                    misura piena; la visione in differita {Number(content.creditsOndemand)}.
                  </p>
                  <Link href={`/live/${liveEvent.id}`} className="btn primary" style={{ alignSelf: 'flex-start' }}>
                    Vai alla sala evento
                  </Link>
                </>
              ) : (
                <p className="muted">Evento non ancora programmato.</p>
              )}
            </div>
          ) : hasAccess ? (
            <VideoPlayer
              contentId={content.id}
              src={content.videoKey}
              initialPct={watchedPct}
              initialPositionSec={progress?.lastPositionSec ?? 0}
              minViewPct={content.minViewPct}
            />
          ) : (
            <div className="card stack locked-card">
              <div className="row" style={{ gap: 10 }}>
                <span className="empty-state-icon" style={{ width: 44, height: 44 }}>
                  <Icon name="lock" size={22} />
                </span>
                <div>
                  <div className="card-title">Contenuto riservato</div>
                  <p className="muted small" style={{ marginTop: 2 }}>
                    {price != null
                      ? `Acquista l'accesso a questo contenuto certificante per € ${price.toFixed(2)}.`
                      : 'Questo contenuto certificante richiede un acquisto o la quota associativa.'}
                  </p>
                </div>
              </div>
              <p className="muted small">
                💡 Gli <strong>associati</strong> hanno accesso incluso a tutti i contenuti certificanti.
              </p>
              {product && (
                <form action={createOrder}>
                  <input type="hidden" name="productId" value={product.id} />
                  <SubmitButton pendingLabel="Reindirizzo…">
                    {price != null ? `Acquista per € ${price.toFixed(2)}` : 'Acquista per accedere'}
                  </SubmitButton>
                </form>
              )}
            </div>
          )}

          {content.description && (
            <div className="card">
              <div className="card-title">Descrizione</div>
              <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{content.description}</p>
            </div>
          )}

          {materials.length > 0 && (
            <div className="card">
              <div className="card-title">Materiali didattici</div>
              <ul style={{ marginTop: 10 }}>
                {materials.map((m) => (
                  <li key={m.id} className="row between" style={{ padding: '6px 0' }}>
                    <span>
                      {m.title} <span className="muted small">({m.kind})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: sticky info + CTA ── */}
        <aside className="stack sticky-card">
          <div className="card stack" style={{ gap: 10 }}>
            {content.certifying ? (
              <span className="badge success" style={{ alignSelf: 'flex-start' }}>
                {credits} crediti formativi
              </span>
            ) : (
              <span className="badge" style={{ alignSelf: 'flex-start' }}>
                Non rilascia crediti
              </span>
            )}
            <Fact k="Tipo" v={isLive ? 'Live' : content.contentType === 'extra' ? 'Extra' : 'Differita'} />
            {content.level && <Fact k="Livello" v={content.level} />}
            {content.durationMin && <Fact k="Durata" v={`${content.durationMin} min`} />}
            {!isLive && content.certifying && <Fact k="Visione minima" v={`${content.minViewPct}%`} />}
            {price != null && price > 0 && <Fact k="Prezzo" v={`€ ${price.toFixed(2)}`} />}

            {!isLive && content.certifying && hasAccess && quiz && (
              <div style={{ marginTop: 6 }}>
                <p className="muted small" style={{ marginBottom: 8 }}>
                  {completed
                    ? 'Soglia raggiunta: puoi sostenere il test per i crediti.'
                    : `Test disponibile dopo il ${content.minViewPct}% (ora ${watchedPct}%).`}
                </p>
                <Link
                  href={`/corso/${content.slug}/test`}
                  className={`btn ${completed ? 'primary' : 'outline'} block`}
                  style={completed ? undefined : { pointerEvents: 'none', opacity: 0.5 }}
                >
                  Vai al test
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="row between small">
      <span className="muted">{k}</span>
      <strong style={{ textTransform: 'capitalize' }}>{v}</strong>
    </div>
  );
}
