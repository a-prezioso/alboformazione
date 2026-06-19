import { NextResponse } from 'next/server';
import { getCurrentUser, canViewOps } from '@/lib/auth';
import { db, creditLedger, certificates, liveAttendance, liveEvents, contents, users } from '@alboformazione/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const me = await getCurrentUser();
  if (!canViewOps(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { kind } = await params;

  let csv: string;
  if (kind === 'crediti') {
    const rows = await db
      .select({
        email: users.email,
        name: users.displayName,
        content: contents.title,
        mode: creditLedger.mode,
        credits: creditLedger.credits,
        date: creditLedger.createdAt
      })
      .from(creditLedger)
      .innerJoin(users, eq(users.id, creditLedger.userId))
      .leftJoin(contents, eq(contents.id, creditLedger.contentId))
      .orderBy(desc(creditLedger.createdAt));
    csv = toCsv(
      ['email', 'nome', 'contenuto', 'modalita', 'crediti', 'data'],
      rows.map((r) => [r.email, r.name ?? '', r.content ?? '', r.mode, Number(r.credits), new Date(r.date).toISOString()])
    );
  } else if (kind === 'certificazioni') {
    const rows = await db
      .select({
        email: users.email,
        name: users.displayName,
        content: contents.title,
        credits: certificates.credits,
        serial: certificates.serial,
        date: certificates.issuedAt
      })
      .from(certificates)
      .innerJoin(users, eq(users.id, certificates.userId))
      .innerJoin(contents, eq(contents.id, certificates.contentId))
      .orderBy(desc(certificates.issuedAt));
    csv = toCsv(
      ['email', 'nome', 'contenuto', 'crediti', 'codice', 'data'],
      rows.map((r) => [r.email, r.name ?? '', r.content, Number(r.credits), r.serial, new Date(r.date).toISOString()])
    );
  } else {
    // partecipazioni (live)
    const rows = await db
      .select({
        email: users.email,
        name: users.displayName,
        content: contents.title,
        joinedAt: liveAttendance.joinedAt,
        minutes: liveAttendance.minutes,
        credited: liveAttendance.credited
      })
      .from(liveAttendance)
      .innerJoin(users, eq(users.id, liveAttendance.userId))
      .innerJoin(liveEvents, eq(liveEvents.id, liveAttendance.liveEventId))
      .innerJoin(contents, eq(contents.id, liveEvents.contentId));
    csv = toCsv(
      ['email', 'nome', 'evento', 'ingresso', 'minuti', 'accreditato'],
      rows.map((r) => [r.email, r.name ?? '', r.content, r.joinedAt ? new Date(r.joinedAt).toISOString() : '', r.minutes, r.credited ? 'si' : 'no'])
    );
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="report-${kind}.csv"`
    }
  });
}
