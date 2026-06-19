import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getCurrentUser } from '@/lib/auth';
import { renderCertificate } from '@alboformazione/adapters';
import { env } from '@alboformazione/config';
import { db, certificates, contents, users } from '@alboformazione/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = new URL(req.url).searchParams.get('download') === '1';
  const me = await getCurrentUser();

  const row = (
    await db
      .select({
        userId: certificates.userId,
        credits: certificates.credits,
        serial: certificates.serial,
        issuedAt: certificates.issuedAt,
        title: contents.title,
        mode: contents.contentType,
        recipient: users.displayName,
        recipientEmail: users.email
      })
      .from(certificates)
      .innerJoin(contents, eq(contents.id, certificates.contentId))
      .innerJoin(users, eq(users.id, certificates.userId))
      .where(eq(certificates.id, id))
      .limit(1)
  )[0];

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (row.userId !== me.id && !me.isAdmin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const verifyUrl = `${env().APP_BASE_URL}/verifica/${row.serial}`;
  const qrPng = await QRCode.toBuffer(verifyUrl, { width: 220, margin: 1 });

  const pdf = await renderCertificate({
    recipientName: row.recipient ?? row.recipientEmail,
    contentTitle: row.title,
    credits: Number(row.credits),
    mode: row.mode === 'live' ? 'live' : 'ondemand',
    serial: row.serial,
    issuedAt: new Date(row.issuedAt),
    associationName: 'Associazione Professionale',
    verifyUrl,
    qrPng
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="attestato-${row.serial}.pdf"`
    }
  });
}
