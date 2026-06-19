import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getContentBySlug, getProgress, getQuiz } from '@/lib/data/catalog';
import { db, quizQuestions } from '@alboformazione/db';
import { asc, eq } from 'drizzle-orm';
import { QuizRunner } from '@/components/QuizRunner';
import { Breadcrumb } from '@/components/Breadcrumb';

export const dynamic = 'force-dynamic';

export default async function TestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const content = await getContentBySlug(slug);
  if (!content) notFound();

  const [quiz, progress] = await Promise.all([getQuiz(content.id), getProgress(user.id, content.id)]);

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div>
        <Breadcrumb
          items={[
            { label: 'Catalogo', href: '/catalogo' },
            { label: content.title, href: `/catalogo/${slug}` },
            { label: 'Test di sblocco' }
          ]}
        />
        <h1 className="page-title" style={{ marginTop: 6 }}>
          Test di sblocco
        </h1>
        <p className="muted">
          Rispondi a tutte le domande. Superando il test ottieni {Number(content.creditsOndemand)} crediti
          e l&apos;attestato.
        </p>
      </div>

      {!quiz ? (
        <div className="card muted">Nessun test configurato per questo contenuto.</div>
      ) : !progress?.completed ? (
        <div className="card stack">
          <span className="badge warn" style={{ alignSelf: 'flex-start' }}>
            Test bloccato
          </span>
          <p className="muted">
            Devi prima raggiungere almeno il {content.minViewPct}% di visione del contenuto (attuale:{' '}
            {progress?.watchedPct ?? 0}%).
          </p>
          <Link href={`/catalogo/${slug}`} className="btn primary" style={{ alignSelf: 'flex-start' }}>
            Torna al contenuto
          </Link>
        </div>
      ) : (
        <QuizQuestions slug={slug} quizId={quiz.id} />
      )}
    </div>
  );
}

async function QuizQuestions({ slug, quizId }: { slug: string; quizId: string }) {
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(asc(quizQuestions.position));

  return (
    <QuizRunner
      slug={slug}
      questions={questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: (q.options as string[]) ?? []
      }))}
    />
  );
}
