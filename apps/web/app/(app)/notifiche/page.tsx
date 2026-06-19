import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { markAllRead, markRead } from '@/lib/actions/notifications';
import { db, notifications } from '@alboformazione/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  acquisto: 'Acquisto',
  credito: 'Credito',
  attestato: 'Attestato',
  evento: 'Evento',
  cfp: 'Obbligo formativo',
  info: 'Info'
};

export default async function NotifichePage() {
  const user = await getCurrentUser();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt));
  const unread = rows.filter((r) => !r.read).length;

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="row between">
        <div>
          <h1 className="page-title">Notifiche</h1>
          <p className="muted">{unread > 0 ? `${unread} non lette` : 'Tutto letto'}</p>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <button className="btn outline small" type="submit">
              Segna tutte come lette
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card muted">Nessuna notifica.</div>
      ) : (
        <div className="stack">
          {rows.map((n) => (
            <div
              className="card row between"
              key={n.id}
              style={{ borderLeft: n.read ? undefined : '3px solid var(--color-primary, #bc2c00)' }}
            >
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="badge">{TYPE_LABEL[n.type] ?? n.type}</span>
                  {!n.read && <span className="badge primary">Nuova</span>}
                </div>
                <div className="card-title" style={{ fontSize: 15, marginTop: 6 }}>
                  {n.title}
                </div>
                {n.body && <p className="muted small">{n.body}</p>}
                <span className="muted small">{new Date(n.createdAt).toLocaleString('it-IT')}</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                {n.link && (
                  <Link href={n.link} className="btn ghost small">
                    Apri
                  </Link>
                )}
                {!n.read && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className="btn outline small" type="submit">
                      Letta
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
