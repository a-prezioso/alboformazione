import Link from 'next/link';
import { Icon } from '@/components/Icon';

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="empty-state card">
      <span className="empty-state-icon" style={{ background: 'var(--color-error-container, #fdd8d8)', color: 'var(--color-error, #b51e1e)' }}>
        <Icon name="lock" size={26} />
      </span>
      <div className="empty-state-title">Accesso non consentito</div>
      <p className="muted small empty-state-desc">
        {message ?? 'Questa sezione è riservata a un ruolo con permessi superiori al tuo.'}
      </p>
      <Link href="/dashboard" className="btn primary">
        Torna alla dashboard
      </Link>
    </div>
  );
}
