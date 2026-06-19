'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { awardCredits } from '@/lib/credits';
import { zoomAdapter } from '@alboformazione/adapters';
import { db, liveEvents, liveAttendance, contents } from '@alboformazione/db';
import { and, eq } from 'drizzle-orm';

export interface LiveResult {
  ok: boolean;
  message: string;
  joinUrl?: string;
  awardedCredits?: number;
}

/**
 * Register participation to a live event. In the POC this simulates the Zoom
 * attendance report: it records the attendance and, since live participation
 * earns full credits (§3.1), awards them via the credit service. Idempotent.
 */
export async function registerLiveAttendance(eventId: string): Promise<LiveResult> {
  const user = await getCurrentUser();
  const event = (await db.select().from(liveEvents).where(eq(liveEvents.id, eventId)).limit(1))[0];
  if (!event) return { ok: false, message: 'Evento non trovato' };
  // Attendance can only be recorded once the event has started (no crediting a
  // future event). In production this is driven by the Zoom attendance report.
  if (new Date(event.startAt).getTime() > Date.now()) {
    return { ok: false, message: 'La partecipazione si potrà registrare all’inizio dell’evento.' };
  }
  const content = (await db.select().from(contents).where(eq(contents.id, event.contentId)).limit(1))[0];

  const joinUrl = event.joinUrl ?? (await zoomAdapter().getJoinUrl(event.zoomMeetingId ?? eventId, user.email));
  const minutes = content?.durationMin ?? 90;

  const existing = (
    await db
      .select()
      .from(liveAttendance)
      .where(and(eq(liveAttendance.liveEventId, eventId), eq(liveAttendance.userId, user.id)))
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(liveAttendance).values({
      liveEventId: eventId,
      userId: user.id,
      joinedAt: new Date(),
      leftAt: new Date(),
      minutes,
      credited: false
    });
  }

  let awardedCredits = 0;
  if (!existing?.credited) {
    const res = await awardCredits({ userId: user.id, contentId: event.contentId, mode: 'live' });
    awardedCredits = res.awarded ? res.credits : 0;
    await db
      .update(liveAttendance)
      .set({ credited: true })
      .where(and(eq(liveAttendance.liveEventId, eventId), eq(liveAttendance.userId, user.id)));
  }

  revalidatePath('/live');
  revalidatePath('/dashboard');
  revalidatePath('/attestati');
  return {
    ok: true,
    message: awardedCredits > 0 ? `Partecipazione registrata. Crediti riconosciuti: ${awardedCredits}.` : 'Partecipazione già registrata.',
    joinUrl,
    awardedCredits
  };
}
