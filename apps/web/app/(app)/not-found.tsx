import Link from 'next/link';

// not-found triggered by notFound() inside the (app) segment — renders within
// the app shell, so content-only (no <html>/<body>).
export default function AppNotFound() {
  return (
    <div className="empty-state card">
      <h1 className="page-title">Contenuto non trovato</h1>
      <p className="muted">L&apos;elemento richiesto non esiste, non è pubblicato o è stato rimosso.</p>
      <Link href="/catalogo" className="btn primary">
        Torna al catalogo
      </Link>
    </div>
  );
}
