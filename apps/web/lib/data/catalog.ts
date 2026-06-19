import 'server-only';
import { db, contents, contentMaterials, viewProgress, liveEvents, quizzes, paths, pathItems } from '@alboformazione/db';
import { and, eq, desc, ne, asc, or, ilike, sql } from 'drizzle-orm';

export type ContentRow = typeof contents.$inferSelect;

/** Published catalog (live + ondemand) with optional search/type/category filters. */
export function listCatalog(filters?: { q?: string; type?: string; category?: string }) {
  const conds = [eq(contents.status, 'published'), ne(contents.contentType, 'extra')];
  if (filters?.q) {
    const q = `%${filters.q}%`;
    conds.push(or(ilike(contents.title, q), ilike(contents.summary, q))!);
  }
  if (filters?.type && filters.type !== 'all') conds.push(eq(contents.contentType, filters.type));
  if (filters?.category && filters.category !== 'all') conds.push(eq(contents.category, filters.category));
  return db.select().from(contents).where(and(...conds)).orderBy(desc(contents.createdAt));
}

/** Distinct categories among published non-extra content. */
export async function listCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: contents.category })
    .from(contents)
    .where(and(eq(contents.status, 'published'), ne(contents.contentType, 'extra')));
  return rows.map((r) => r.category).filter((c): c is string => !!c).sort();
}

/** Published learning paths with item counts. */
export function listPaths() {
  return db
    .select({
      id: paths.id,
      slug: paths.slug,
      title: paths.title,
      description: paths.description,
      items: sql<number>`(select count(*)::int from alboformazione.path_items pi where pi.path_id = ${paths.id})`
    })
    .from(paths)
    .where(eq(paths.status, 'published'))
    .orderBy(asc(paths.title));
}

export async function getPathBySlug(slug: string) {
  const p = (await db.select().from(paths).where(eq(paths.slug, slug)).limit(1))[0];
  if (!p) return null;
  const items = await db
    .select({ content: contents, position: pathItems.position })
    .from(pathItems)
    .innerJoin(contents, eq(contents.id, pathItems.contentId))
    .where(eq(pathItems.pathId, p.id))
    .orderBy(asc(pathItems.position));
  return { path: p, items };
}

/** Published extra (non-certifying) content. */
export function listExtra() {
  return db
    .select()
    .from(contents)
    .where(and(eq(contents.status, 'published'), eq(contents.contentType, 'extra')))
    .orderBy(desc(contents.createdAt));
}

export async function getContentBySlug(slug: string): Promise<ContentRow | null> {
  const rows = await db.select().from(contents).where(eq(contents.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export function getMaterials(contentId: string) {
  return db
    .select()
    .from(contentMaterials)
    .where(eq(contentMaterials.contentId, contentId))
    .orderBy(asc(contentMaterials.createdAt));
}

export async function getProgress(userId: string, contentId: string) {
  const rows = await db
    .select()
    .from(viewProgress)
    .where(and(eq(viewProgress.userId, userId), eq(viewProgress.contentId, contentId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLiveEvent(contentId: string) {
  const rows = await db
    .select()
    .from(liveEvents)
    .where(eq(liveEvents.contentId, contentId))
    .orderBy(desc(liveEvents.startAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getQuiz(contentId: string) {
  const rows = await db.select().from(quizzes).where(eq(quizzes.contentId, contentId)).limit(1);
  return rows[0] ?? null;
}
