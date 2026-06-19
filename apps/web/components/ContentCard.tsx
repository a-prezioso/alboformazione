import Link from 'next/link';
import type { ContentRow } from '@/lib/data/catalog';
import type { AccessState } from '@/lib/access';
import { Icon } from '@/components/Icon';

function AccessTag({ access }: { access: AccessState }) {
  switch (access.kind) {
    case 'included':
      return (
        <span className="badge success">
          <Icon name="check" size={13} /> Incluso
        </span>
      );
    case 'owned':
      return (
        <span className="badge success">
          <Icon name="check" size={13} /> Acquistato
        </span>
      );
    case 'free':
      return <span className="badge">Gratuito</span>;
    case 'locked':
      return (
        <span className="badge tertiary">
          <Icon name="lock" size={13} />
          {access.price != null ? `€ ${access.price.toFixed(2)}` : 'Su acquisto'}
        </span>
      );
  }
}

function typeBadge(c: ContentRow) {
  if (c.contentType === 'live') return <span className="badge live">Live</span>;
  if (c.contentType === 'extra') return <span className="badge extra">Extra</span>;
  return <span className="badge">Differita</span>;
}

// Deterministic gradient per category, so cards have a recognisable cover.
// Warm, on-brand palette derived from the @esh "business" tokens
// (primary #BC2C00, tertiary #FCB045, accent #222) — no off-brand blue/teal.
const PALETTES: string[][] = [
  ['#BC2C00', '#760C00'], // primary
  ['#9A3412', '#4C0100'], // burnt amber → primary container dark
  ['#B45309', '#5C2A04'], // warm brown
  ['#D2691E', '#8A2B00'], // terracotta
  ['#3E1800', '#760C00'], // deep cocoa → primary
  ['#A8521C', '#3E1800'], // sienna
  ['#222222', '#4C0100'] // accent dark → primary container dark
];
function cover(category?: string | null): string {
  const key = category ?? 'x';
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const p = PALETTES[h % PALETTES.length];
  return `linear-gradient(135deg, ${p[0]}, ${p[1]})`;
}

export function ContentCard({
  content,
  price,
  access,
  basePath = '/catalogo'
}: {
  content: ContentRow;
  price?: number | null;
  access?: AccessState;
  basePath?: string;
}) {
  const credits =
    content.contentType === 'live' ? Number(content.creditsLive) : Number(content.creditsOndemand);
  return (
    <Link href={`${basePath}/${content.slug}`} className="card hover" style={{ display: 'block', padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          height: 84,
          background: cover(content.category),
          display: 'flex',
          alignItems: 'flex-end',
          padding: 12
        }}
      >
        <span className="badge" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
          {content.category ?? 'Formazione'}
        </span>
      </div>
      <div style={{ padding: 16 }}>
        <div className="row between" style={{ marginBottom: 8 }}>
          {typeBadge(content)}
          {content.certifying ? (
            <span className="badge success">{credits} crediti</span>
          ) : (
            <span className="badge">Senza crediti</span>
          )}
        </div>
        <div className="card-title" style={{ fontSize: 16 }}>
          {content.title}
        </div>
        <p className="muted small" style={{ marginTop: 8, minHeight: 38 }}>
          {content.summary ?? ''}
        </p>
        <div className="row between" style={{ marginTop: 10 }}>
          <span className="muted small">
            {content.level ? content.level : ''}
            {content.durationMin ? `${content.level ? ' · ' : ''}${content.durationMin} min` : ''}
          </span>
          {access ? (
            <AccessTag access={access} />
          ) : (
            price != null && price > 0 && <strong>€ {price.toFixed(2)}</strong>
          )}
        </div>
      </div>
    </Link>
  );
}
