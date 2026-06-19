import QRCode from 'qrcode';
import { env } from '@alboformazione/config';
import { db, certificates, contents, users } from '@alboformazione/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const row = (
    await db
      .select({
        credits: certificates.credits,
        issuedAt: certificates.issuedAt,
        content: contents.title,
        mode: contents.contentType,
        holder: users.displayName,
        holderEmail: users.email
      })
      .from(certificates)
      .innerJoin(contents, eq(contents.id, certificates.contentId))
      .innerJoin(users, eq(users.id, certificates.userId))
      .where(eq(certificates.serial, serial))
      .limit(1)
  )[0];

  const verifyUrl = `${env().APP_BASE_URL}/verifica/${serial}`;
  const qr = await QRCode.toDataURL(verifyUrl, { width: 160, margin: 1 });

  // Mask the holder name for privacy on the public page.
  const maskedHolder = row?.holder
    ? row.holder
        .split(' ')
        .map((p) => (p.length > 1 ? `${p[0]}${'•'.repeat(Math.max(1, p.length - 1))}` : p))
        .join(' ')
    : '';

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card stack" style={{ maxWidth: 520, width: '100%' }}>
        <div className="row between">
          <strong style={{ fontSize: 18 }}>Albo Formazione</strong>
          <span className="muted small">Verifica attestato</span>
        </div>

        {!row ? (
          <>
            <span className="badge warn" style={{ alignSelf: 'flex-start' }}>
              Attestato non trovato
            </span>
            <p className="muted">
              Nessun attestato corrisponde al codice <code>{serial}</code>.
            </p>
          </>
        ) : (
          <>
            <span className="badge success" style={{ alignSelf: 'flex-start' }}>
              ✓ Attestato valido
            </span>
            <div className="stack" style={{ gap: 8 }}>
              <Row k="Codice" v={serial} />
              <Row k="Intestatario" v={maskedHolder} />
              <Row k="Attività" v={row.content} />
              <Row k="Crediti" v={`${Number(row.credits)} (${row.mode === 'live' ? 'Live' : 'Differita'})`} />
              <Row k="Data rilascio" v={new Date(row.issuedAt).toLocaleDateString('it-IT')} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR verifica" width={120} height={120} style={{ alignSelf: 'center' }} />
            <p className="muted small" style={{ textAlign: 'center' }}>
              Documento verificato dalla piattaforma dell&apos;Associazione Professionale.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row between">
      <span className="muted small">{k}</span>
      <strong style={{ textAlign: 'right' }}>{v}</strong>
    </div>
  );
}
