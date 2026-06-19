import { NextResponse } from 'next/server';
import { env } from '@alboformazione/config';
import { notify } from '@/lib/notify';
import { db, liveEvents, contents, users, notifications } from '@alboformazione/db';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Daily reminder job (triggered by a scheduled pipeline / cron hitting this URL
 * with ?token=REMINDER_TOKEN). Notifies all users of live events starting within
 * the next 48h. Idempotent: one reminder per user/event.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  const expected = env().REMINDER_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 3600 * 1000);

  const events = await db
    .select({ id: liveEvents.id, startAt: liveEvents.startAt, title: contents.title })
    .from(liveEvents)
    .innerJoin(contents, eq(contents.id, liveEvents.contentId))
    .where(and(eq(liveEvents.status, 'scheduled'), gte(liveEvents.startAt, now), lte(liveEvents.startAt, in48h)));

  const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
  let sent = 0;

  for (const ev of events) {
    const link = `/live/${ev.id}`;
    const title = 'Promemoria evento live';
    for (const u of allUsers) {
      const exists = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.userId, u.id), eq(notifications.link, link), eq(notifications.type, 'evento')))
        .limit(1);
      if (exists.length) continue;
      await notify({
        userId: u.id,
        type: 'evento',
        title,
        body: `L'evento live "${ev.title}" inizia il ${new Date(ev.startAt).toLocaleString('it-IT')}.`,
        link,
        email: u.email
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, events: events.length, remindersSent: sent });
}
