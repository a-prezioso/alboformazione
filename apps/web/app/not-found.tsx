import Link from 'next/link';
import '@esh/tokens/css';
import './globals.css';

// Global not-found (unmatched URLs) renders standalone, so it must provide its
// own <html>/<body> and import the design tokens + base styles.
export default function NotFound() {
  return (
    <html lang="it" data-brand="business" data-theme="light">
      <body>
        <div className="error-screen">
          <div className="card error-card">
            <span className="brand-mark" aria-hidden="true">
              AF
            </span>
            <h1 className="page-title">Pagina non trovata</h1>
            <p className="muted">La pagina che cerchi non esiste o è stata spostata.</p>
            <Link href="/dashboard" className="btn primary">
              Torna alla dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
