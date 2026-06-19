import 'server-only';
import { db, creditLedger, cfpRules, contents } from '@alboformazione/db';
import { eq, desc, sql } from 'drizzle-orm';

export interface YearRow {
  year: number;
  requiredAnnual: number;
  earned: number;
  compliant: boolean;
  triennioLabel: string | null;
  requiredTriennio: number | null;
}

export interface TriennioSummary {
  label: string;
  required: number;
  earned: number;
  compliant: boolean;
  years: number[];
}

export async function getLibretto(userId: string) {
  const rules = await db.select().from(cfpRules).orderBy(cfpRules.year);

  const earnedRows = await db
    .select({
      year: sql<number>`extract(year from ${creditLedger.createdAt})::int`,
      total: sql<string>`coalesce(sum(${creditLedger.credits}),0)`
    })
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .groupBy(sql`extract(year from ${creditLedger.createdAt})`);
  const earnedByYear = new Map<number, number>(earnedRows.map((r) => [r.year, Number(r.total)]));

  const years: YearRow[] = rules.map((r) => {
    const earned = earnedByYear.get(r.year) ?? 0;
    return {
      year: r.year,
      requiredAnnual: Number(r.requiredAnnual),
      earned,
      compliant: earned >= Number(r.requiredAnnual),
      triennioLabel: r.triennioLabel,
      requiredTriennio: r.requiredTriennio != null ? Number(r.requiredTriennio) : null
    };
  });

  // Triennium aggregation.
  const byLabel = new Map<string, TriennioSummary>();
  for (const y of years) {
    if (!y.triennioLabel) continue;
    const cur = byLabel.get(y.triennioLabel) ?? {
      label: y.triennioLabel,
      required: y.requiredTriennio ?? 0,
      earned: 0,
      compliant: false,
      years: []
    };
    cur.earned += y.earned;
    cur.years.push(y.year);
    byLabel.set(y.triennioLabel, cur);
  }
  const trienni = [...byLabel.values()].map((t) => ({ ...t, compliant: t.earned >= t.required }));

  return { years, trienni };
}

export async function getCreditDetail(userId: string) {
  return db
    .select({
      credits: creditLedger.credits,
      mode: creditLedger.mode,
      reason: creditLedger.reason,
      date: creditLedger.createdAt,
      content: contents.title
    })
    .from(creditLedger)
    .leftJoin(contents, eq(contents.id, creditLedger.contentId))
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt));
}
