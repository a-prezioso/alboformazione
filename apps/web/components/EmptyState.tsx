import Link from 'next/link';
import { Icon, type IconName } from '@/components/Icon';

/** Friendly empty state: icon + message + optional call-to-action.
 * Replaces bare "card muted" one-liners so empty sections look intentional. */
export function EmptyState({
  icon = 'extra',
  title,
  description,
  cta
}: {
  icon?: IconName;
  title: string;
  description?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="empty-state card">
      <span className="empty-state-icon" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      <div className="empty-state-title">{title}</div>
      {description && <p className="muted small empty-state-desc">{description}</p>}
      {cta && (
        <Link href={cta.href} className="btn primary">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
