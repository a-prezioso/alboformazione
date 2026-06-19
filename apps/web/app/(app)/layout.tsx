import Link from 'next/link';
import { cookies } from 'next/headers';
import { getCurrentUser, canManage, canManageUsers, canViewOps, DEMO_PROFILE_COOKIE } from '@/lib/auth';
import { NavLink } from '@/components/NavLink';
import { DemoProfileSwitcher } from '@/components/DemoProfileSwitcher';
import { MobileNavToggle } from '@/components/MobileNavToggle';
import { UserMenu } from '@/components/UserMenu';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';
import { Icon, type IconName } from '@/components/Icon';
import { db, notifications } from '@alboformazione/db';
import { and, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type NavItem = { href: string; label: string; icon: IconName };

const MEMBER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/catalogo', label: 'Catalogo', icon: 'catalog' },
  { href: '/percorsi', label: 'Percorsi', icon: 'paths' },
  { href: '/i-miei-corsi', label: 'I miei corsi', icon: 'my-courses' },
  { href: '/live', label: 'Eventi live', icon: 'live' },
  { href: '/libretto', label: 'Libretto formativo', icon: 'libretto' },
  { href: '/attestati', label: 'Attestati', icon: 'certificate' },
  { href: '/acquisti', label: 'Acquisti', icon: 'cart' },
  { href: '/extra', label: 'Contenuti extra', icon: 'extra' },
  { href: '/account', label: 'Account', icon: 'account' }
];

type AdminGate = 'ops' | 'content' | 'users';
type AdminNavItem = NavItem & { gate: AdminGate };

const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics', gate: 'ops' },
  { href: '/admin/contenuti', label: 'Contenuti', icon: 'content', gate: 'content' },
  { href: '/admin/live', label: 'Eventi live', icon: 'live', gate: 'content' },
  { href: '/admin/utenti', label: 'Utenti e ruoli', icon: 'users', gate: 'users' },
  { href: '/admin/verifiche', label: 'Verifiche', icon: 'verify', gate: 'ops' },
  { href: '/admin/report', label: 'Report', icon: 'report', gate: 'ops' }
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const c = await cookies();
  const demoCookie = c.get(DEMO_PROFILE_COOKIE)?.value ?? null;
  const showAdmin = canManage(user);
  const adminNav = ADMIN_NAV.filter((n) =>
    n.gate === 'content' ? true : n.gate === 'ops' ? canViewOps(user) : canManageUsers(user)
  );

  const [unreadRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
  const unread = unreadRow?.n ?? 0;

  const membershipLabel = user.membership === 'associato' ? 'Associato' : 'Non associato';

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Navigazione principale">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            AF
          </span>
          <span className="brand-text">
            Albo<strong>Formazione</strong>
          </span>
        </div>

        <nav className="nav-scroll">
          <div className="nav-section">Area riservata</div>
          {MEMBER_NAV.map((n) => (
            <NavLink key={n.href} href={n.href} label={n.label} icon={n.icon} />
          ))}
          {showAdmin && adminNav.length > 0 && (
            <>
              <div className="nav-section">Backoffice</div>
              {adminNav.map((n) => (
                <NavLink key={n.href} href={n.href} label={n.label} icon={n.icon} />
              ))}
            </>
          )}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <MobileNavToggle />
          <div className="topbar-brand">
            <span className="brand-mark sm" aria-hidden="true">
              AF
            </span>
            <strong>Albo Formazione</strong>
          </div>
          <div className="spacer" />
          <DemoProfileSwitcher current={demoCookie} />
          <Link
            href="/notifiche"
            className="icon-btn"
            title="Notifiche"
            aria-label={`Notifiche${unread ? `, ${unread} non lette` : ''}`}
          >
            <Icon name="bell" size={20} />
            {unread > 0 && <span className="notif-dot">{unread}</span>}
          </Link>
          <UserMenu
            name={user.displayName}
            email={user.email}
            membershipLabel={membershipLabel}
            isAdmin={user.isAdmin}
          />
        </header>
        <ImpersonationBanner
          active={user.impersonating}
          profileKey={demoCookie ?? ''}
          name={user.displayName}
          membershipLabel={membershipLabel}
          isAdmin={user.isAdmin}
        />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
