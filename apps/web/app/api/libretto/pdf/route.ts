import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getCurrentUser } from '@/lib/auth';
import { getLibretto, getCreditDetail } from '@/lib/data/cfp';
import { db, users, memberDetails } from '@alboformazione/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const me = await getCurrentUser();
  const qUser = new URL(req.url).searchParams.get('userId');
  const targetId = qUser && me.isAdmin ? qUser : me.id;

  const [u] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!u) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const [det] = await db.select().from(memberDetails).where(eq(memberDetails.userId, targetId)).limit(1);
  const { years, trienni } = await getLibretto(targetId);
  const detail = await getCreditDetail(targetId);

  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]); // A4 portrait
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.07, 0.12, 0.28);
  const red = rgb(0.737, 0.173, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const W = 595;
  let y = 800;

  const line = (text: string, x: number, size: number, f = font, color = rgb(0.1, 0.1, 0.1)) =>
    page.drawText(text, { x, y, size, font: f, color });
  const nl = (d = 16) => {
    y -= d;
    if (y < 60) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
  };

  line('Albo Formazione', 50, 20, bold, red);
  nl(10);
  line('Libretto formativo', 50, 13, font, gray);
  nl(28);
  line(u.displayName ?? u.email, 50, 16, bold, navy);
  nl(16);
  line(u.email, 50, 10, font, gray);
  if (det?.profession || det?.registrationNumber) {
    nl(13);
    line(`${det?.profession ?? ''}${det?.registrationNumber ? ' — iscr. ' + det.registrationNumber : ''}`, 50, 10, font, gray);
  }
  nl(28);

  // Triennio
  for (const t of trienni) {
    line(`Triennio ${t.label}`, 50, 13, bold, navy);
    line(`${t.earned} / ${t.required} crediti — ${t.compliant ? 'Adempiente' : 'In difetto'}`, 320, 12, bold, t.compliant ? rgb(0.08, 0.5, 0.24) : red);
    nl(22);
  }

  // Per-year table
  line('Obbligo annuale', 50, 12, bold, navy);
  nl(18);
  line('Anno', 50, 10, bold, gray);
  line('Maturati', 160, 10, bold, gray);
  line('Richiesti', 260, 10, bold, gray);
  line('Stato', 380, 10, bold, gray);
  nl(15);
  for (const yr of years) {
    line(String(yr.year), 50, 11);
    line(String(yr.earned), 160, 11);
    line(String(yr.requiredAnnual), 260, 11);
    line(yr.compliant ? 'Adempiente' : 'In difetto', 380, 11, font, yr.compliant ? rgb(0.08, 0.5, 0.24) : red);
    nl(15);
  }
  nl(14);

  // Movimenti
  line('Dettaglio movimenti crediti', 50, 12, bold, navy);
  nl(18);
  for (const d of detail) {
    const date = new Date(d.date).toLocaleDateString('it-IT');
    const label = (d.content ?? d.reason ?? '').slice(0, 52);
    line(date, 50, 10, font, gray);
    line(label, 130, 10);
    line(d.mode === 'live' ? 'Live' : 'Differita', 420, 10, font, gray);
    line(`+${Number(d.credits)}`, 510, 10, bold);
    nl(15);
  }

  // Footer
  y = 40;
  line(`Generato il ${new Date().toLocaleDateString('it-IT')} — documento dimostrativo`, 50, 8, font, gray);

  const bytes = await doc.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="libretto-${(u.displayName ?? 'utente').replace(/\s+/g, '-')}.pdf"`
    }
  });
}
