import { notFound } from 'next/navigation';
import { ContentEditor } from '@/components/admin/ContentEditor';
import { Breadcrumb } from '@/components/Breadcrumb';
import { db, contents, contentMaterials, quizzes, quizQuestions, liveEvents } from '@alboformazione/db';
import { asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function EditContenutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = (await db.select().from(contents).where(eq(contents.id, id)).limit(1))[0];
  if (!content) notFound();

  const materials = await db
    .select()
    .from(contentMaterials)
    .where(eq(contentMaterials.contentId, id))
    .orderBy(asc(contentMaterials.createdAt));

  const quizRow = (await db.select().from(quizzes).where(eq(quizzes.contentId, id)).limit(1))[0];
  let quiz = null;
  if (quizRow) {
    const qs = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizRow.id))
      .orderBy(asc(quizQuestions.position));
    quiz = {
      passPct: quizRow.passPct,
      questions: qs.map((q) => ({
        prompt: q.prompt,
        options: (q.options as string[]) ?? [],
        correctIndex: q.correctIndex
      }))
    };
  }

  const events = await db
    .select()
    .from(liveEvents)
    .where(eq(liveEvents.contentId, id))
    .orderBy(asc(liveEvents.startAt));

  return (
    <div className="stack">
      <div>
        <Breadcrumb items={[{ label: 'Contenuti', href: '/admin/contenuti' }, { label: content.title }]} />
        <h1 className="page-title" style={{ marginTop: 6 }}>
          {content.title}
        </h1>
      </div>
      <ContentEditor content={content} materials={materials} quiz={quiz} liveEvents={events} />
    </div>
  );
}
