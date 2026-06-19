import 'server-only';
import { db, contents, creditLedger, certificates } from '@alboformazione/db';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { notify } from '@/lib/notify';
import { users } from '@alboformazione/db';

export type CreditMode = 'live' | 'ondemand';

export interface AwardResult {
  awarded: boolean;
  credits: number;
  reason: string;
  certificateId?: string;
}

/**
 * Award formative credits for completing a content in a given mode, then issue
 * a certificate. Idempotent (one ledger entry + one certificate per
 * user/content). Enforces §3.1 (differentiated credits) and §3.2 (no
 * retroactivity: credits only when `credits_active_from` is set and elapsed).
 */
export async function awardCredits(input: {
  userId: string;
  contentId: string;
  mode: CreditMode;
}): Promise<AwardResult> {
  const c = (await db.select().from(contents).where(eq(contents.id, input.contentId)).limit(1))[0];
  if (!c) return { awarded: false, credits: 0, reason: 'contenuto inesistente' };
  if (!c.certifying) return { awarded: false, credits: 0, reason: 'contenuto non certificante' };

  // §3.2 — no retroactivity.
  if (!c.creditsActiveFrom || new Date(c.creditsActiveFrom) > new Date()) {
    return { awarded: false, credits: 0, reason: 'crediti non attivi per questo contenuto' };
  }

  // §3.1 — differentiated amount.
  const credits = input.mode === 'live' ? Number(c.creditsLive) : Number(c.creditsOndemand);

  // Idempotency: certificate already issued?
  const existingCert = (
    await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, input.userId), eq(certificates.contentId, input.contentId)))
      .limit(1)
  )[0];
  if (existingCert) {
    return { awarded: false, credits: Number(existingCert.credits), reason: 'già rilasciato', certificateId: existingCert.id };
  }

  await db.insert(creditLedger).values({
    userId: input.userId,
    contentId: input.contentId,
    mode: input.mode,
    credits: String(credits),
    reason: input.mode === 'live' ? 'Partecipazione evento live' : 'Completamento contenuto in differita + test'
  });

  const serial = `AF-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const cert = (
    await db
      .insert(certificates)
      .values({ userId: input.userId, contentId: input.contentId, credits: String(credits), serial })
      .onConflictDoNothing()
      .returning()
  )[0];

  const u = (await db.select({ email: users.email }).from(users).where(eq(users.id, input.userId)).limit(1))[0];
  await notify({
    userId: input.userId,
    type: 'attestato',
    title: 'Attestato disponibile',
    body: `Hai ottenuto ${credits} crediti per "${c.title}". L'attestato è scaricabile.`,
    link: '/attestati',
    email: u?.email
  });

  return { awarded: true, credits, reason: 'rilasciato', certificateId: cert?.id };
}
