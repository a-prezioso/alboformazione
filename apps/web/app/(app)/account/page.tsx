import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { saveMemberDetails } from '@/lib/actions/account';
import { SubmitButton } from '@/components/SubmitButton';
import { Icon } from '@/components/Icon';
import { db, memberDetails, orders } from '@alboformazione/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await getCurrentUser();
  const details = (await db.select().from(memberDetails).where(eq(memberDetails.userId, user.id)).limit(1))[0];
  const myOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <h1 className="page-title">Account</h1>
        <p className="muted">Dati anagrafici, condizioni e storico.</p>
      </div>

      {saved && (
        <div className="card success-note">
          <Icon name="check" size={18} /> Dati salvati correttamente.
        </div>
      )}

      <div className="grid cols-2">
        <div className="card">
          <div className="card-title">Profilo</div>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            <div className="row between">
              <span className="muted small">Nome</span>
              <strong>{user.displayName}</strong>
            </div>
            <div className="row between">
              <span className="muted small">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="row between">
              <span className="muted small">Ruoli</span>
              <span>{user.roles.join(', ') || '—'}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Condizioni economiche</div>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            <div className="row between">
              <span className="muted small">Stato membership</span>
              {user.membership === 'associato' ? (
                <span className="badge success">Associato</span>
              ) : (
                <span className="badge">Non associato</span>
              )}
            </div>
            <div className="row between">
              <span className="muted small">Fascia tariffaria</span>
              <span>{user.economicTier}</span>
            </div>
            <p className="muted small">
              {user.membership === 'associato'
                ? 'Accesso incluso ai contenuti certificanti e prezzi riservati agli associati.'
                : 'Prezzi a listino per non associati; accesso ai contenuti tramite acquisto.'}
            </p>
          </div>
        </div>
      </div>

      <form action={saveMemberDetails} className="card stack">
        <div className="card-title">Dati anagrafici</div>
        <div className="grid cols-2">
          <div className="field">
            <label>Codice fiscale</label>
            <input className="input" name="fiscalCode" defaultValue={details?.fiscalCode ?? ''} />
          </div>
          <div className="field">
            <label>Professione</label>
            <input className="input" name="profession" defaultValue={details?.profession ?? ''} />
          </div>
          <div className="field">
            <label>Numero iscrizione albo</label>
            <input className="input" name="registrationNumber" defaultValue={details?.registrationNumber ?? ''} />
          </div>
          <div className="field">
            <label>Telefono</label>
            <input className="input" name="phone" defaultValue={details?.phone ?? ''} />
          </div>
          <div className="field">
            <label>Città</label>
            <input className="input" name="city" defaultValue={details?.city ?? ''} />
          </div>
        </div>
        <span style={{ alignSelf: 'flex-start' }}>
          <SubmitButton pendingLabel="Salvo…">Salva dati</SubmitButton>
        </span>
      </form>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="card-title">Storico ordini</div>
          <Link href="/libretto" className="btn ghost small">
            Vai al libretto formativo
          </Link>
        </div>
        {myOrders.length === 0 ? (
          <p className="muted small">Nessun ordine.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Ordine</th>
                <th>Totale</th>
                <th>Stato</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((o) => (
                <tr key={o.id}>
                  <td className="muted small">{o.id.slice(0, 8)}</td>
                  <td>€ {Number(o.total).toFixed(2)}</td>
                  <td>{o.status === 'paid' ? <span className="badge success">Pagato</span> : <span className="badge warn">In sospeso</span>}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString('it-IT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
