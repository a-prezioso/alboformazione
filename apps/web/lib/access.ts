import 'server-only';
import { db, entitlements, products } from '@alboformazione/db';
import { and, eq, or } from 'drizzle-orm';
import type { SessionUser } from './auth';

export interface ContentLike {
  id: string;
  contentType: string;
  certifying: boolean;
}

/**
 * Access policy for the POC:
 * - extra (non-certifying) content is always free to watch;
 * - associati have free access to certifying content (membership benefit);
 * - everyone with an explicit entitlement (purchase/grant) has access;
 * - otherwise access requires a purchase (e-commerce).
 */
export async function canAccessContent(user: SessionUser, content: ContentLike): Promise<boolean> {
  if (content.contentType === 'extra' || !content.certifying) return true;
  if (user.membership === 'associato') return true;
  if (user.isAdmin) return true;
  const ent = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.userId, user.id), eq(entitlements.contentId, content.id)))
    .limit(1);
  return ent.length > 0;
}

/** Price the user pays for a product, based on membership status. */
export function priceForUser(
  product: { priceMember: string; priceNonMember: string },
  membership: string
): number {
  return Number(membership === 'associato' ? product.priceMember : product.priceNonMember);
}

/** Find the product (if any) that sells access to a given content. */
export async function productForContent(contentId: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.active, true), or(eq(products.contentId, contentId))))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * How the *current* user can access a piece of content — drives the visible
 * gating (lock / price / "incluso" / "acquistato") across cards and detail.
 * Makes the difference between profiles (associato vs non associato) legible.
 */
export type AccessState =
  | { kind: 'free' } // extra / non-certifying → always watchable
  | { kind: 'included' } // membership benefit (associato/admin)
  | { kind: 'owned' } // explicit entitlement (purchased/granted)
  | { kind: 'locked'; price: number | null }; // requires purchase

export async function contentAccess(user: SessionUser, content: ContentLike): Promise<AccessState> {
  if (content.contentType === 'extra' || !content.certifying) return { kind: 'free' };
  if (user.membership === 'associato' || user.isAdmin) return { kind: 'included' };
  const ent = await db
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(and(eq(entitlements.userId, user.id), eq(entitlements.contentId, content.id)))
    .limit(1);
  if (ent.length > 0) return { kind: 'owned' };
  const product = await productForContent(content.id);
  return { kind: 'locked', price: product ? priceForUser(product, user.membership) : null };
}
