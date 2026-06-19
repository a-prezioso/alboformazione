import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { db, liveEvents, contents, liveAttendance } from '@alboformazione/db';
import { and, eq, desc } from 'drizzle-orm';
import { LiveEventActions } from '@/components/LiveEventActions';

export const dynamic = 'force-dynamic';

export default async function LivePage() {
  const user = await getCurrentUser();
  const events = await db
    .select({
      id: liveEvents.id,
      startAt: liveEvents.startAt,
      endAt: liveEvents.endAt,
      status: liveEvents.status,
      joinUrl: liveEvents.joinUrl,
      recordingKey: liveEvents.recordingKey,
      title: contents.title,
      slug: contents.slug,
      credits: contents.creditsLive
    })
    .from(liveEvents)
    .innerJoin(contents, eq(contents.id, liveEvents.contentId))
    .orderBy(desc(liveEvents.startAt));

  const myAttendance = await db
    .select({ eventId: liveAttendance.liveEventId, credited: liveAttendance.credited })
    .from(liveAttendance)
    .where(eq(liveAttendance.userId, user.id));
  const creditedSet = new Set(myAttendance.filter((a) => a.credited).map((a) => a.eventId));

  return (
    <div className="stack">
      <div>
        <h1 className="page-title">Eventi live</h1>
        <p className="muted">
          Webinar in videoconferenza. La partecipazione riconosce i crediti in misura piena.
        </p>
      </div>
      {events.length === 0 ? (
        <div className="card muted">Nessun evento live.</div>
      ) : (
        events.map((e) => (
          <div className="card stack" key={e.id}>
            <div className="row between">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="badge live">Live</span>
                  <span className="badge success">{Number(e.credits)} crediti</span>
                </div>
                <Link href={`/live/${e.id}`} className="card-title" style={{ display: 'block', marginTop: 8 }}>
                  {e.title}
                </Link>
                <p className="muted small" style={{ marginTop: 4 }}>
                  {new Date(e.startAt).toLocaleString('it-IT')}
                  {e.endAt ? ` — ${new Date(e.endAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : ''}
                </p>
              </div>
            </div>
            <div className="row between wrap">
              <LiveEventActions
                eventId={e.id}
                joinUrl={e.joinUrl}
                alreadyCredited={creditedSet.has(e.id)}
                startAt={new Date(e.startAt).toISOString()}
              />
              <div className="row" style={{ gap: 8 }}>
                <Link href={`/live/${e.id}`} className="btn outline small">
                  Sala evento
                </Link>
                <Link href={`/catalogo/${e.slug}`} className="btn ghost small">
                  Scheda contenuto
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
