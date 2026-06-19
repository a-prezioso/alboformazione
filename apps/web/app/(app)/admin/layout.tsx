import { getCurrentUser, canManage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!canManage(user)) {
    return (
      <div className="card">
        <h2>Accesso non consentito</h2>
        <p className="muted">Il backoffice è riservato a operatori, formatori e amministratori.</p>
      </div>
    );
  }
  return <>{children}</>;
}
