import Link from 'next/link';
import { db, liveEvents, contents, liveAttendance } from '@alboformazione/db';
import { and, asc, eq, desc, sql } from 'drizzle-orm';
import { getCurrentUser, canManage, isContentAuthorOnly } from '@/lib/auth';
import { AccessDenied } from '@/components/AccessDenied';
import { PageHeader } from '@/components/PageHeader';
import { createLiveEvent, cancelLiveEvent } from '@/lib/actions/admin';

export const dynamic = 'force-dynamic';

export default async function AdminLivePage() {
  const me = await getCurrentUser();
  if (!canManage(me)) return <AccessDenied />;
  const ownOnly = isContentAuthorOnly(me);

  const rows = await db
    .select({
      id: liveEvents.id,
      title: contents.title,
      contentId: contents.id,
      slug: contents.slug,
      startAt: liveEvents.startAt,
      status: liveEvents.status,
      meeting: liveEvents.zoomMeetingId,
      attendees: sql<number>`(select count(*)::int from alboformazione.live_attendance la where la.live_event_id = alboformazione.live_events.id)`
    })
    .from(liveEvents)
    .innerJoin(contents, eq(contents.id, liveEvents.contentId))
    .where(ownOnly ? eq(contents.authorId, me.id) : undefined)
    .orderBy(desc(liveEvents.startAt));

  // Live contents available to schedule an event for.
  const liveContents = await db
    .select({ id: contents.id, title: contents.title })
    .from(contents)
    .where(
      ownOnly
        ? and(eq(contents.contentType, 'live'), eq(contents.authorId, me.id))
        : eq(contents.contentType, 'live')
    )
    .orderBy(asc(contents.title));

  const now = Date.now();

  return (
    <div className="stack">
      <PageHeader title="Eventi live" subtitle="Pianifica e monitora i webinar in videoconferenza." />

      {/* Schedule a new event */}
      <div className="card stack">
        <div className="card-title">Pianifica un nuovo evento</div>
        {liveContents.length === 0 ? (
          <p className="muted small">
            Non ci sono contenuti di tipo <strong>Live</strong>. Creane uno da{' '}
            <Link href="/admin/contenuti/nuovo" className="breadcrumb-link">
              Contenuti → Nuovo contenuto
            </Link>{' '}
            (tipo «Live»), poi torna qui per programmarlo.
          </p>
        ) : (
          <form action={createLiveEvent} className="grid cols-4" style={{ alignItems: 'end' }}>
            <div className="field" style={{ gridColumn: 'span 2' }}>
              <label>Contenuto live</label>
              <select className="select" name="contentId" required>
                {liveContents.map((lc) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Inizio</label>
              <input className="input" name="startAt" type="datetime-local" required />
            </div>
            <div className="field">
              <label>Durata (min)</label>
              <input className="input" name="durationMin" type="number" defaultValue={90} />
            </div>
            <button className="btn primary" type="submit" style={{ gridColumn: 'span 4', justifySelf: 'start' }}>
              Crea evento Zoom
            </button>
          </form>
        )}
      </div>

      {/* Existing events */}
      {rows.length === 0 ? (
        <div className="card muted">Nessun evento programmato.</div>
      ) : (
        <table className="table card" style={{ padding: 0 }}>
          <thead>
            <tr>
              <th>Evento</th>
              <th>Inizio</th>
              <th>Stato</th>
              <th>Partecipanti</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const ended = e.status === 'ended' || new Date(e.startAt).getTime() < now;
              const cancelled = e.status === 'cancelled';
              return (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{new Date(e.startAt).toLocaleString('it-IT')}</td>
                  <td>
                    <span className={`badge ${cancelled ? 'warn' : ended ? '' : 'success'}`}>{e.status}</span>
                  </td>
                  <td>{e.attendees}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row" style={{ gap: 8, justifyContent: 'flex-end' }}>
                      <Link href={`/live/${e.id}`} className="btn ghost small">
                        Sala
                      </Link>
                      <Link href={`/admin/contenuti/${e.contentId}`} className="btn ghost small">
                        Contenuto
                      </Link>
                      {!cancelled && !ended && (
                        <form action={cancelLiveEvent}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="btn outline small" type="submit">
                            Annulla
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
