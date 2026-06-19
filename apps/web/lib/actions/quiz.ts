'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { awardCredits } from '@/lib/credits';
import { db, contents, quizzes, quizQuestions, quizAttempts, viewProgress } from '@alboformazione/db';
import { and, asc, eq } from 'drizzle-orm';

export interface QuizResult {
  ok: boolean;
  message: string;
  scorePct?: number;
  passed?: boolean;
  awardedCredits?: number;
}

export async function submitQuiz(input: { slug: string; answers: number[] }): Promise<QuizResult> {
  const user = await getCurrentUser();
  const content = (await db.select().from(contents).where(eq(contents.slug, input.slug)).limit(1))[0];
  if (!content) return { ok: false, message: 'Contenuto non trovato' };

  const quiz = (await db.select().from(quizzes).where(eq(quizzes.contentId, content.id)).limit(1))[0];
  if (!quiz || !quiz.active) return { ok: false, message: 'Test non disponibile' };

  // Gate: minimum viewing percentage reached (§3.4).
  const prog = (
    await db
      .select()
      .from(viewProgress)
      .where(and(eq(viewProgress.userId, user.id), eq(viewProgress.contentId, content.id)))
      .limit(1)
  )[0];
  if (!prog?.completed) {
    return { ok: false, message: `Devi prima raggiungere il ${content.minViewPct}% di visione.` };
  }

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(asc(quizQuestions.position));

  const total = questions.length;
  const correct = questions.reduce(
    (acc, q, i) => acc + (input.answers[i] === q.correctIndex ? 1 : 0),
    0
  );
  const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = scorePct >= quiz.passPct;

  await db.insert(quizAttempts).values({
    quizId: quiz.id,
    userId: user.id,
    scorePct,
    passed,
    answers: input.answers
  });

  let awardedCredits = 0;
  if (passed) {
    const res = await awardCredits({ userId: user.id, contentId: content.id, mode: 'ondemand' });
    awardedCredits = res.awarded ? res.credits : 0;
  }

  revalidatePath(`/catalogo/${input.slug}`);
  revalidatePath('/attestati');
  revalidatePath('/dashboard');

  return {
    ok: true,
    message: passed
      ? `Test superato (${scorePct}%). Crediti riconosciuti: ${awardedCredits}.`
      : `Test non superato (${scorePct}%). Riprova.`,
    scorePct,
    passed,
    awardedCredits
  };
}
