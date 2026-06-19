'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { submitQuiz, type QuizResult } from '@/lib/actions/quiz';

interface Question {
  id: string;
  prompt: string;
  options: string[];
}

export function QuizRunner({ slug, questions }: { slug: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();

  const allAnswered = answers.every((a) => a >= 0);

  function submit() {
    start(async () => setResult(await submitQuiz({ slug, answers })));
  }

  if (result?.passed) {
    return (
      <div className="card stack">
        <span className="badge success" style={{ alignSelf: 'flex-start' }}>
          Test superato — {result.scorePct}%
        </span>
        <p>{result.message}</p>
        <Link href="/attestati" className="btn primary" style={{ alignSelf: 'flex-start' }}>
          Vai ai tuoi attestati
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      {result && !result.passed && (
        <div className="card" style={{ borderColor: 'var(--color-error, #b91c1c)' }}>
          {result.message}
        </div>
      )}
      {questions.map((q, qi) => (
        <div className="card" key={q.id}>
          <div className="card-title" style={{ fontSize: 16, marginBottom: 10 }}>
            {qi + 1}. {q.prompt}
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {q.options.map((opt, oi) => (
              <label key={oi} className="row" style={{ gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() =>
                    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                  }
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button className="btn primary" disabled={!allAnswered || pending} onClick={submit}>
        {pending ? 'Invio…' : 'Invia risposte'}
      </button>
    </div>
  );
}
