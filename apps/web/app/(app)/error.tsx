'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface in server/console logs for debugging.
    console.error('App error boundary:', error);
  }, [error]);

  return (
    <div className="error-screen">
      <div className="card error-card">
        <h1 className="page-title">Si è verificato un errore</h1>
        <p className="muted">
          Qualcosa è andato storto durante il caricamento di questa sezione. Puoi riprovare o tornare alla
          dashboard.
        </p>
        <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={() => reset()}>
            Riprova
          </button>
          <Link href="/dashboard" className="btn outline">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
