'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, canManage, canManageUsers } from '@/lib/auth';
import { chat } from '@alboformazione/ai';
import { zoomAdapter } from '@alboformazione/adapters';
import {
  db,
  contents,
  contentMaterials,
  quizzes,
  quizQuestions,
  liveEvents,
  memberships,
  roles,
  userRoles,
  auditLog
} from '@alboformazione/db';
import { and, eq } from 'drizzle-orm';

async function requireManager() {
  const user = await getCurrentUser();
  if (!canManage(user)) throw new Error('forbidden');
  return user;
}

/** Admin-only guard for sensitive operations (users, roles, memberships). */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!canManageUsers(user)) throw new Error('forbidden');
  return user;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

async function audit(actorEmail: string, action: string, entity: string, entityId: string, meta: object = {}) {
  await db.insert(auditLog).values({ actorEmail, action, entity, entityId, meta });
}

const num = (v: FormDataEntryValue | null, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export async function upsertContent(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!title) throw new Error('Titolo obbligatorio');
  const contentType = String(formData.get('contentType') ?? 'ondemand');
  const certifying = formData.get('certifying') === 'on';
  const creditsActiveFromRaw = String(formData.get('creditsActiveFrom') ?? '').trim();

  const values = {
    title,
    slug: String(formData.get('slug') ?? '').trim() || slugify(title),
    summary: String(formData.get('summary') ?? '') || null,
    description: String(formData.get('description') ?? '') || null,
    contentType,
    extraKind: contentType === 'extra' ? String(formData.get('extraKind') ?? '') || null : null,
    certifying,
    creditsLive: String(num(formData.get('creditsLive'))),
    creditsOndemand: String(num(formData.get('creditsOndemand'))),
    minViewPct: num(formData.get('minViewPct'), 80),
    durationMin: num(formData.get('durationMin')) || null,
    videoKey: String(formData.get('videoKey') ?? '') || null,
    creditsActiveFrom: certifying && creditsActiveFromRaw ? new Date(creditsActiveFromRaw) : null,
    updatedAt: new Date()
  };

  let contentId = id;
  if (id) {
    await db.update(contents).set(values).where(eq(contents.id, id));
    await audit(user.email, 'content.update', 'content', id);
  } else {
    const row = (await db.insert(contents).values({ ...values, authorId: user.id }).returning())[0];
    contentId = row.id;
    await audit(user.email, 'content.create', 'content', contentId);
  }
  revalidatePath('/admin/contenuti');
  revalidatePath('/catalogo');
  redirect(`/admin/contenuti/${contentId}`);
}

/**
 * Unified create/update for the tabbed ContentEditor. Returns {id} on create
 * (client navigates) or {ok} on update (client refreshes + shows feedback).
 * No redirect() — that does not reliably client-navigate in production.
 */
export async function saveContent(
  _prev: { id?: string; ok?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ id?: string; ok?: boolean; error?: string }> {
  let user;
  try {
    user = await requireManager();
  } catch {
    return { error: 'Permessi insufficienti' };
  }
  const id = String(formData.get('id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  if (!title) return { error: 'Il titolo è obbligatorio' };
  const contentType = String(formData.get('contentType') ?? 'ondemand');
  const certifying = formData.get('certifying') === 'on';
  const creditsActiveFromRaw = String(formData.get('creditsActiveFrom') ?? '').trim();
  const values = {
    title,
    slug: String(formData.get('slug') ?? '').trim() || slugify(title),
    summary: String(formData.get('summary') ?? '') || null,
    description: String(formData.get('description') ?? '') || null,
    contentType,
    extraKind: contentType === 'extra' ? String(formData.get('extraKind') ?? '') || null : null,
    certifying,
    creditsLive: String(num(formData.get('creditsLive'))),
    creditsOndemand: String(num(formData.get('creditsOndemand'))),
    minViewPct: num(formData.get('minViewPct'), 80),
    durationMin: num(formData.get('durationMin')) || null,
    videoKey: String(formData.get('videoKey') ?? '') || null,
    creditsActiveFrom: certifying && creditsActiveFromRaw ? new Date(creditsActiveFromRaw) : null,
    updatedAt: new Date()
  };
  if (id) {
    await db.update(contents).set(values).where(eq(contents.id, id));
    await audit(user.email, 'content.update', 'content', id);
    revalidatePath('/admin/contenuti');
    revalidatePath(`/admin/contenuti/${id}`);
    revalidatePath('/catalogo');
    return { ok: true };
  }
  const row = (await db.insert(contents).values({ ...values, authorId: user.id }).returning())[0];
  await audit(user.email, 'content.create', 'content', row.id);
  revalidatePath('/admin/contenuti');
  revalidatePath('/catalogo');
  return { id: row.id };
}

export async function setContentStatus(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? 'draft');
  await db.update(contents).set({ status, updatedAt: new Date() }).where(eq(contents.id, id));
  await audit(user.email, 'content.status', 'content', id, { status });
  revalidatePath('/admin/contenuti');
  revalidatePath(`/admin/contenuti/${id}`);
  revalidatePath('/catalogo');
}

export async function addMaterial(formData: FormData) {
  const user = await requireManager();
  const contentId = String(formData.get('contentId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const fileKey = String(formData.get('fileKey') ?? '').trim();
  if (!title || !fileKey) throw new Error('Titolo e file obbligatori');
  await db.insert(contentMaterials).values({
    contentId,
    title,
    fileKey,
    kind: String(formData.get('kind') ?? 'document')
  });
  await audit(user.email, 'material.add', 'content', contentId, { title });
  revalidatePath(`/admin/contenuti/${contentId}`);
}

export async function deleteMaterial(formData: FormData) {
  await requireManager();
  const id = String(formData.get('id') ?? '');
  const contentId = String(formData.get('contentId') ?? '');
  await db.delete(contentMaterials).where(eq(contentMaterials.id, id));
  revalidatePath(`/admin/contenuti/${contentId}`);
}

/** Save the unlock test: replaces the question set (2–3 MCQ). */
export async function saveQuiz(formData: FormData) {
  const user = await requireManager();
  const contentId = String(formData.get('contentId') ?? '');
  const passPct = num(formData.get('passPct'), 100);

  let quiz = (await db.select().from(quizzes).where(eq(quizzes.contentId, contentId)).limit(1))[0];
  if (!quiz) {
    quiz = (await db.insert(quizzes).values({ contentId, passPct, active: true }).returning())[0];
  } else {
    await db.update(quizzes).set({ passPct, active: true }).where(eq(quizzes.id, quiz.id));
  }

  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
  for (let i = 0; i < 3; i++) {
    const prompt = String(formData.get(`q${i}_prompt`) ?? '').trim();
    if (!prompt) continue;
    const options = [0, 1, 2]
      .map((o) => String(formData.get(`q${i}_opt${o}`) ?? '').trim())
      .filter(Boolean);
    if (options.length < 2) continue;
    await db.insert(quizQuestions).values({
      quizId: quiz.id,
      prompt,
      options,
      correctIndex: num(formData.get(`q${i}_correct`)),
      position: i
    });
  }
  await audit(user.email, 'quiz.save', 'content', contentId);
  revalidatePath(`/admin/contenuti/${contentId}`);
}

/**
 * AI-assist (§backoffice): drafts 3 multiple-choice unlock-test questions from
 * the content via the internal AI Gateway (tenant `alboformazione`) and persists
 * them as the content quiz. Best-effort: on an unparseable reply it leaves the
 * quiz unchanged.
 */
export async function aiDraftQuiz(formData: FormData) {
  const user = await requireManager();
  const contentId = String(formData.get('contentId') ?? '');
  const content = (await db.select().from(contents).where(eq(contents.id, contentId)).limit(1))[0];
  if (!content) throw new Error('Contenuto non trovato');

  const userPrompt = `Genera 3 domande a risposta multipla (3 opzioni ciascuna) per verificare la comprensione di questo contenuto formativo.
Titolo: ${content.title}
Descrizione: ${content.description ?? content.summary ?? content.title}
Rispondi SOLO con JSON valido in questo formato, senza altro testo:
[{"prompt":"testo domanda","options":["opzione 1","opzione 2","opzione 3"],"correct":0}]
dove "correct" è l'indice (0,1,2) della risposta corretta.`;

  let raw = '';
  try {
    raw = await chat(
      [
        { role: 'system', content: 'Sei un esperto di formazione professionale. Rispondi esclusivamente con JSON valido.' },
        { role: 'user', content: userPrompt }
      ],
      { temperature: 0.4 }
    );
  } catch {
    return; // AI non disponibile — nessuna modifica
  }

  const cleaned = raw.replace(/```json|```/g, '').trim();
  let parsed: Array<{ prompt: string; options: string[]; correct: number }> = [];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return;
      }
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return;

  let quiz = (await db.select().from(quizzes).where(eq(quizzes.contentId, contentId)).limit(1))[0];
  if (!quiz) {
    quiz = (await db.insert(quizzes).values({ contentId, passPct: 100, active: true }).returning())[0];
  }
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
  const items = parsed.slice(0, 3);
  for (let i = 0; i < items.length; i++) {
    const q = items[i];
    const options = (q.options ?? []).slice(0, 3).map((o) => String(o));
    if (!q.prompt || options.length < 2) continue;
    await db.insert(quizQuestions).values({
      quizId: quiz.id,
      prompt: String(q.prompt),
      options,
      correctIndex: Number.isInteger(q.correct) ? Math.max(0, Math.min(2, q.correct)) : 0,
      position: i
    });
  }
  await audit(user.email, 'quiz.ai_draft', 'content', contentId);
  revalidatePath(`/admin/contenuti/${contentId}`);
}

export async function createLiveEvent(formData: FormData) {
  const user = await requireManager();
  const contentId = String(formData.get('contentId') ?? '');
  const startRaw = String(formData.get('startAt') ?? '');
  const durationMin = num(formData.get('durationMin'), 90);
  if (!contentId || !startRaw) throw new Error('Contenuto e data obbligatori');

  const content = (await db.select().from(contents).where(eq(contents.id, contentId)).limit(1))[0];
  const startAt = new Date(startRaw);
  const meeting = await zoomAdapter().createMeeting({
    topic: content?.title ?? 'Evento live',
    startAt,
    durationMin
  });
  await db.insert(liveEvents).values({
    contentId,
    zoomMeetingId: meeting.meetingId,
    joinUrl: meeting.joinUrl,
    startAt,
    endAt: new Date(startAt.getTime() + durationMin * 60000),
    status: 'scheduled'
  });
  await audit(user.email, 'live.create', 'content', contentId, { meetingId: meeting.meetingId });
  revalidatePath('/admin/live');
  revalidatePath('/live');
}

/** Cancel (soft) a scheduled live event. */
export async function cancelLiveEvent(formData: FormData) {
  const user = await requireManager();
  const id = String(formData.get('id') ?? '');
  await db.update(liveEvents).set({ status: 'cancelled' }).where(eq(liveEvents.id, id));
  await audit(user.email, 'live.cancel', 'live_event', id);
  revalidatePath('/admin/live');
  revalidatePath('/live');
}

export async function setMembership(formData: FormData) {
  const user = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const status = String(formData.get('status') ?? 'non_associato');
  await db
    .insert(memberships)
    .values({ userId, status })
    .onConflictDoUpdate({ target: memberships.userId, set: { status } });
  await audit(user.email, 'membership.set', 'user', userId, { status });
  revalidatePath('/admin/utenti');
}

export async function toggleRole(formData: FormData) {
  const user = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const slug = String(formData.get('role') ?? '');
  const role = (await db.select().from(roles).where(eq(roles.slug, slug)).limit(1))[0];
  if (!role) return;
  const existing = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)));
  } else {
    await db.insert(userRoles).values({ userId, roleId: role.id });
  }
  await audit(user.email, 'role.toggle', 'user', userId, { role: slug });
  revalidatePath('/admin/utenti');
}
