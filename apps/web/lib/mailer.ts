import 'server-only';
import nodemailer from 'nodemailer';
import { env } from '@alboformazione/config';
import { db, emailLog } from '@alboformazione/db';

let _transport: nodemailer.Transporter | undefined;

function transport() {
  if (_transport) return _transport;
  const e = env();
  const authed = !!e.SMTP_USER;
  _transport = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_PORT === 465,
    // Authenticated SMTP (e.g. Google Workspace): STARTTLS + login.
    // Unauthenticated internal relay: opportunistic TLS, no auth.
    ...(authed
      ? { requireTLS: true, auth: { user: e.SMTP_USER, pass: e.SMTP_PASS } }
      : { ignoreTLS: true, tls: { rejectUnauthorized: false } }),
    // Don't let a dead relay hang server actions / requests.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  });
  return _transport;
}

async function logEmail(recipient: string, subject: string, status: string, error?: string) {
  try {
    await db.insert(emailLog).values({ recipient, subject, status, error: error ?? null });
  } catch {
    /* logging must never break the flow */
  }
}

/** Best-effort email via the internal mail gateway. Never throws; records outcome. */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const e = env();
  if (!e.MAIL_ENABLED || !to) {
    await logEmail(to || '(none)', subject, 'skipped', 'mail disabled or no recipient');
    return false;
  }
  try {
    const info = await transport().sendMail({
      from: e.MAIL_FROM,
      to,
      subject,
      text: body,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1a1814">
        <h2 style="color:#bc2c00;margin:0 0 8px">Albo Formazione</h2>
        <p>${body.replace(/\n/g, '<br>')}</p>
        <hr style="border:0;border-top:1px solid #eee;margin:16px 0">
        <p style="color:#888;font-size:12px">Associazione Professionale — piattaforma formativa digitale</p>
      </div>`
    });
    await logEmail(to, subject, 'sent', info?.messageId ? `id=${info.messageId}` : undefined);
    return true;
  } catch (err) {
    await logEmail(to, subject, 'failed', (err as Error).message?.slice(0, 300));
    return false;
  }
}
