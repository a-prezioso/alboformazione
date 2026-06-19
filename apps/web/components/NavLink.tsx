'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

export function NavLink({ href, label, icon }: { href: string; label: string; icon?: IconName }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`nav-item${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => document.body.classList.remove('nav-open')}
    >
      {icon && <Icon name={icon} size={18} className="nav-item-icon" />}
      <span>{label}</span>
    </Link>
  );
}
