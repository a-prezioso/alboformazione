import { setMembership, toggleRole } from '@/lib/actions/admin';
import { getCurrentUser, canManageUsers } from '@/lib/auth';
import { AccessDenied } from '@/components/AccessDenied';
import { PageHeader } from '@/components/PageHeader';
import { Icon } from '@/components/Icon';
import { db, users, memberships, roles, userRoles } from '@alboformazione/db';
import { asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const ROLE_HELP: Record<string, string> = {
  member: 'Iscritto: accede all’area riservata.',
  formatore: 'Gestisce i propri contenuti nel backoffice.',
  operatore: 'Segreteria: contenuti, verifiche, report (no utenti).',
  admin: 'Amministratore: accesso completo, inclusa la gestione utenti.'
};

export default async function AdminUtentiPage() {
  const me = await getCurrentUser();
  if (!canManageUsers(me)) {
    return <AccessDenied message="La gestione di utenti, ruoli e membership è riservata agli amministratori." />;
  }
  const allUsers = await db.select().from(users).orderBy(asc(users.email));
  const allRoles = await db.select().from(roles).orderBy(asc(roles.id));
  const mems = await db.select().from(memberships);
  const urs = await db.select().from(userRoles);

  const memByUser = new Map(mems.map((m) => [m.userId, m.status]));
  const rolesByUser = new Map<string, Set<number>>();
  for (const ur of urs) {
    if (!rolesByUser.has(ur.userId)) rolesByUser.set(ur.userId, new Set());
    rolesByUser.get(ur.userId)!.add(ur.roleId);
  }

  return (
    <div className="stack">
      <PageHeader
        title="Utenti, ruoli e permessi"
        subtitle="Imposta lo stato associativo e attiva/disattiva i ruoli. Le modifiche sono immediate."
      />

      <div className="card stack" style={{ gap: 6 }}>
        <div className="card-title" style={{ fontSize: 15 }}>Legenda ruoli</div>
        <div className="row wrap" style={{ gap: 14 }}>
          {allRoles.map((r) => (
            <span key={r.id} className="muted small">
              <strong>{r.label}</strong> — {ROLE_HELP[r.slug] ?? r.slug}
            </span>
          ))}
        </div>
      </div>

      <table className="table card" style={{ padding: 0 }}>
        <thead>
          <tr>
            <th>Utente</th>
            <th>Stato associativo</th>
            <th>Ruoli (clic per attivare/disattivare)</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map((u) => {
            const status = memByUser.get(u.id) ?? 'non_associato';
            const userRoleIds = rolesByUser.get(u.id) ?? new Set();
            return (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{u.displayName ?? u.email}</div>
                  <div className="muted small">{u.email}</div>
                  <a href={`/api/libretto/pdf?userId=${u.id}`} target="_blank" className="breadcrumb-link small">
                    Libretto PDF
                  </a>
                </td>
                <td>
                  <div className="stack" style={{ gap: 6, alignItems: 'flex-start' }}>
                    <span className={`badge ${status === 'associato' ? 'success' : ''}`}>
                      {status === 'associato' ? 'Associato' : 'Non associato'}
                    </span>
                    <form action={setMembership} className="row" style={{ gap: 6 }}>
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="status" defaultValue={status} className="select" style={{ width: 'auto', padding: '4px 8px' }}>
                        <option value="associato">Associato</option>
                        <option value="non_associato">Non associato</option>
                      </select>
                      <button className="btn outline small" type="submit">Applica</button>
                    </form>
                  </div>
                </td>
                <td>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {allRoles.map((r) => {
                      const has = userRoleIds.has(r.id);
                      return (
                        <form action={toggleRole} key={r.id}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="role" value={r.slug} />
                          <button
                            className={`btn ${has ? 'primary' : 'outline'} small`}
                            type="submit"
                            title={has ? `Disattiva «${r.label}»` : `Attiva «${r.label}»`}
                          >
                            {has ? <Icon name="check" size={13} /> : null} {r.label}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
