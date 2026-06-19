import 'server-only';
import { headers, cookies } from 'next/headers';
import { db, users, memberships, roles, userRoles } from '@alboformazione/db';
import { eq } from 'drizzle-orm';
import { ssoAdapter } from '@alboformazione/adapters';
import { DEMO_PROFILE_COOKIE, DEMO_PROFILES, type MembershipStatus } from './profiles';

export { DEMO_PROFILE_COOKIE, DEMO_PROFILES, type MembershipStatus };

/** Provision membership + roles for a freshly-created user via the SSO adapter. */
async function provisionFromSso(userId: string, email: string): Promise<void> {
  const profile = await ssoAdapter().verify(email);
  if (!profile) return;
  await db
    .insert(memberships)
    .values({ userId, status: profile.membership, economicTier: profile.economicTier })
    .onConflictDoNothing();
  for (const slug of profile.roles) {
    const r = await db.select({ id: roles.id }).from(roles).where(eq(roles.slug, slug)).limit(1);
    if (r[0]) {
      await db.insert(userRoles).values({ userId, roleId: r[0].id }).onConflictDoNothing();
    }
  }
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  membership: MembershipStatus;
  economicTier: string;
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** True when viewing through the demo profile switcher. */
  impersonating: boolean;
}

async function loadProfile(email: string, fallbackName: string): Promise<SessionUser> {
  // Upsert user by SSO email.
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let user = existing[0];
  if (!user) {
    const inserted = await db
      .insert(users)
      .values({ email, displayName: fallbackName })
      .onConflictDoNothing()
      .returning();
    user = inserted[0] ?? (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    // First login → resolve identity/membership/roles from the institutional
    // SSO adapter (mock in the POC) and provision membership + roles.
    await provisionFromSso(user.id, email);
  }

  const mem = await db.select().from(memberships).where(eq(memberships.userId, user.id)).limit(1);
  const rs = await db
    .select({ slug: roles.slug })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, user.id));
  const roleSlugs = rs.map((r) => r.slug);

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? email,
    membership: (mem[0]?.status as MembershipStatus) ?? 'non_associato',
    economicTier: mem[0]?.economicTier ?? 'standard',
    roles: roleSlugs,
    isAdmin: roleSlugs.includes('admin') || user.isSuperAdmin,
    isSuperAdmin: user.isSuperAdmin,
    impersonating: false
  };
}

/** Resolve the current session user from Traefik X-Auth-* headers + demo switcher. */
export async function getCurrentUser(): Promise<SessionUser> {
  const h = await headers();
  // Public app (no SSO gate): without X-Auth headers, default to a demo member
  // (NOT an admin). Internal access via SSO still carries the real identity.
  const ssoEmail = h.get('x-auth-request-email') ?? 'mario.rossi@demo.it';
  const ssoName = h.get('x-auth-user-name') ?? 'Mario Rossi';

  const base = await loadProfile(ssoEmail, ssoName);

  // Demo profile switcher: open to everyone (this is a public demo). The
  // institutional SSO would enforce real identity in production.
  const c = await cookies();
  const demoKey = c.get(DEMO_PROFILE_COOKIE)?.value;
  if (demoKey) {
    const profile = DEMO_PROFILES.find((p) => p.key === demoKey);
    if (profile) {
      // Always view through the selected demo profile (dedicated demo accounts).
      const impersonated = await loadProfile(profile.email, profile.label);
      return { ...impersonated, impersonating: profile.email !== ssoEmail };
    }
  }
  return base;
}

export function hasRole(user: SessionUser, role: string): boolean {
  return user.roles.includes(role) || user.isSuperAdmin;
}

/** Can access the backoffice at all (operatore, formatore, admin, superadmin). */
export function canManage(user: SessionUser): boolean {
  return user.isAdmin || user.isSuperAdmin || user.roles.includes('operatore') || user.roles.includes('formatore');
}

/** Full administrator: manage users, roles and memberships. ADMIN ONLY. */
export function canManageUsers(user: SessionUser): boolean {
  return user.isAdmin || user.isSuperAdmin;
}

/** Operational/reporting views (analytics, verifiche, report): admin + operatore.
 * Formatori are content authors and do not see organisation-wide reporting. */
export function canViewOps(user: SessionUser): boolean {
  return user.isAdmin || user.isSuperAdmin || user.roles.includes('operatore');
}

/** Author/manage learning content and live events (operatore, formatore, admin). */
export function canAuthorContent(user: SessionUser): boolean {
  return canManage(user);
}

/** A formatore that is neither operatore nor admin → scoped to their OWN content. */
export function isContentAuthorOnly(user: SessionUser): boolean {
  return (
    user.roles.includes('formatore') &&
    !user.isAdmin &&
    !user.isSuperAdmin &&
    !user.roles.includes('operatore')
  );
}
