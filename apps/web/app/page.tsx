import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <main>
      <section className="landing-hero">
        <div className="container">
          <span className="badge primary" style={{ marginBottom: 18 }}>
            Piattaforma Formativa Digitale
          </span>
          <h1>La formazione della tua Associazione Professionale, digitale e tracciabile.</h1>
          <p style={{ maxWidth: 620, opacity: 0.85, fontSize: 18, marginTop: 18 }}>
            Eventi <strong>Live</strong> e contenuti in <strong>Differita</strong>, crediti formativi
            differenziati, test di sblocco, attestati scaricabili ed e-commerce — in un unico ambiente.
          </p>
          <div className="row" style={{ marginTop: 28 }}>
            <Link href="/dashboard" className="btn primary">
              Entra nell&apos;area riservata
            </Link>
            <Link href="/catalogo" className="btn outline">
              Esplora il catalogo
            </Link>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '56px 24px' }}>
        <div className="grid cols-3">
          {[
            ['Live + Differita', 'Webinar in videoconferenza e contenuti on-demand con tracciamento della visione.'],
            ['Crediti formativi', 'Assegnazione differenziata: misura piena per i live, ridotta per la differita.'],
            ['Test di sblocco', 'Verifica finale a risposta multipla dopo la soglia minima di visione.'],
            ['Attestati', 'Certificati generati automaticamente e disponibili al download.'],
            ['E-commerce', 'Acquisto di corsi, webinar e pacchetti con prezzi per associati e non.'],
            ['Backoffice', 'Gestione contenuti, crediti, utenti, verifiche e report per gli operatori.']
          ].map(([title, body]) => (
            <div className="card" key={title}>
              <div className="card-title">{title}</div>
              <p className="muted" style={{ marginTop: 8 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container" style={{ padding: '24px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <span className="muted small">Albo Formazione — Elite Software House · POC</span>
      </footer>
    </main>
  );
}
