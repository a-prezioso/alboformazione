'use server';

import { getCurrentUser } from '@/lib/auth';
import { db, contents, viewProgress } from '@alboformazione/db';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Heartbeat from the video player. Stores the max watched percentage and last
 * position; marks the content completed once the configured minimum viewing
 * percentage (§3.3) is reached. Returns the effective state.
 */
export async function updateProgress(input: {
  contentId: string;
  watchedPct: number;
  positionSec: number;
}): Promise<{ watchedPct: number; completed: boolean }> {
  const user = await getCurrentUser();
  const pct = Math.max(0, Math.min(100, Math.round(input.watchedPct)));

  const c = await db
    .select({ minViewPct: contents.minViewPct })
    .from(contents)
    .where(eq(contents.id, input.contentId))
    .limit(1);
  const minViewPct = c[0]?.minViewPct ?? 80;
  const completedNow = pct >= minViewPct;

  await db
    .insert(viewProgress)
    .values({
      userId: user.id,
      contentId: input.contentId,
      watchedPct: pct,
      lastPositionSec: Math.round(input.positionSec),
      completed: completedNow
    })
    .onConflictDoUpdate({
      target: [viewProgress.userId, viewProgress.contentId],
      set: {
        watchedPct: sql`greatest(${viewProgress.watchedPct}, ${pct})`,
        lastPositionSec: Math.round(input.positionSec),
        completed: sql`(${viewProgress.completed} or ${completedNow})`,
        updatedAt: sql`now()`
      }
    });

  const row = await db
    .select({ watchedPct: viewProgress.watchedPct, completed: viewProgress.completed })
    .from(viewProgress)
    .where(and(eq(viewProgress.userId, user.id), eq(viewProgress.contentId, input.contentId)))
    .limit(1);
  return { watchedPct: row[0]?.watchedPct ?? pct, completed: row[0]?.completed ?? completedNow };
}
