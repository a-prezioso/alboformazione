import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getMaterials } from '@/lib/data/catalog';
import { db, liveEvents, contents, liveAttendance } from '@alboformazione/db';
import { and, eq } from 'drizzle-orm';
import { Countdown } from '@/components/Countdown';
import { LiveEventActions } from '@/components/LiveEventActions';
import { Breadcrumb } from '@/components/Breadcrumb';

export const dynamic = 'force-dynamic';

export default async function LiveRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const row = (
    await db
      .select({
        id: liveEvents.id,
        startAt: liveEvents.startAt,
        endAt: liveEvents.endAt,
        status: liveEvents.status,
        joinUrl: liveEvents.joinUrl,
        recordingKey: liveEvents.recordingKey,
        contentId: contents.id,
        title: contents.title,
        slug: contents.slug,
        summary: contents.summary,
        credits: contents.creditsLive
      })
      .from(liveEvents)
      .innerJoin(contents, eq(contents.id, liveEvents.contentId))
      .where(eq(liveEvents.id, id))
      .limit(1)
  )[0];
  if (!row) notFound();

  const [materials, att] = await Promise.all([
    getMaterials(row.contentId),
    db
      .select({ credited: liveAttendance.credited })
      .from(liveAttendance)
      .where(and(eq(liveAttendance.liveEventId, row.id), eq(liveAttendance.userId, user.id)))
      .limit(1)
  ]);
  const credited = att[0]?.credited ?? false;
  const ended = row.status === 'ended' || (row.endAt && new Date(row.endAt) < new Date());

  return (
    <div className="stack narrow">
      <div>
        <Breadcrumb items={[{ label: 'Eventi live', href: '/live' }, { label: row.title }]} />
        <div className="row" style={{ marginTop: 8, marginBottom: 6 }}>
          <span className="badge live">Live</span>
          <span className="badge success">{Number(row.credits)} crediti</span>
          {ended && <span className="badge">Concluso</span>}
        </div>
        <h1 className="page-title">{row.title}</h1>
        {row.summary && <p className="muted">{row.summary}</p>}
      </div>

      <div className="detail-grid">
        <div className="stack">
          <div className="card stack" style={{ alignItems: 'center', gap: 16, padding: 28 }}>
            {ended ? (
              <>
                <span className="badge">Evento concluso</span>
                {row.recordingKey ? (
                  <a href={row.recordingKey} target="_blank" className="btn primary">
                    Guarda la registrazione
                  </a>
                ) : (
                  <p className="muted small">Registrazione non ancora disponibile.</p>
                )}
              </>
            ) : (
              <>
                <span className="muted small">Inizio tra</span>
                <Countdown target={new Date(row.startAt).toISOString()} />
                <LiveEventActions
                  eventId={row.id}
                  joinUrl={row.joinUrl}
                  alreadyCredited={credited}
                  startAt={new Date(row.startAt).toISOString()}
                />
              </>
            )}
          </div>

          <div className="card">
            <div className="card-title">Dettagli</div>
            <div className="stack" style={{ gap: 6, marginTop: 8 }}>
              <div className="row between small">
                <span className="muted">Inizio</span>
                <strong>{new Date(row.startAt).toLocaleString('it-IT')}</strong>
              </div>
              {row.endAt && (
                <div className="row between small">
                  <span className="muted">Fine</span>
                  <strong>{new Date(row.endAt).toLocaleString('it-IT')}</strong>
                </div>
              )}
              <div className="row between small">
                <span className="muted">Crediti (partecipazione live)</span>
                <strong>{Number(row.credits)}</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="stack sticky-card">
          <div className="card">
            <div className="card-title">Materiali</div>
            {materials.length === 0 ? (
              <p className="muted small" style={{ marginTop: 8 }}>
                Nessun materiale pubblicato.
              </p>
            ) : (
              <ul style={{ marginTop: 8 }}>
                {materials.map((m) => (
                  <li key={m.id} style={{ padding: '4px 0' }}>
                    {m.title} <span className="muted small">({m.kind})</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/catalogo/${row.slug}`} className="btn outline small block" style={{ marginTop: 10 }}>
              Scheda contenuto
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
