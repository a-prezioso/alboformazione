import Link from 'next/link';
import { Fragment } from 'react';

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail for detail/nested pages — gives navigation context. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="Percorso">
      {items.map((c, i) => {
        const last = i === items.length - 1;
        return (
          <Fragment key={i}>
            {c.href && !last ? (
              <Link href={c.href} className="breadcrumb-link">
                {c.label}
              </Link>
            ) : (
              <span aria-current={last ? 'page' : undefined} className={last ? 'breadcrumb-current' : undefined}>
                {c.label}
              </span>
            )}
            {!last && <span className="breadcrumb-sep" aria-hidden="true">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
