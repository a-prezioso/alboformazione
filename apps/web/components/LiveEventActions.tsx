'use client';

import { useState, useTransition } from 'react';
import { registerLiveAttendance, type LiveResult } from '@/lib/actions/live';

export function LiveEventActions({
  eventId,
  joinUrl,
  alreadyCredited,
  startAt
}: {
  eventId: string;
  joinUrl: string | null;
  alreadyCredited: boolean;
  startAt?: string;
}) {
  const [result, setResult] = useState<LiveResult | null>(null);
  const [pending, start] = useTransition();
  const notStarted = startAt ? new Date(startAt).getTime() > Date.now() : false;
  const credited = alreadyCredited || (result?.awardedCredits ?? 0) > 0 || result?.ok;

  return (
    <div className="row wrap" style={{ gap: 10 }}>
      {joinUrl && (
        <a href={joinUrl} target="_blank" className="btn primary">
          Entra nell&apos;evento (Zoom)
        </a>
      )}
      <button
        className="btn outline"
        disabled={pending || alreadyCredited || notStarted}
        title={notStarted ? "Disponibile all'inizio dell'evento" : undefined}
        onClick={() => start(async () => setResult(await registerLiveAttendance(eventId)))}
      >
        {alreadyCredited
          ? 'Presenza registrata'
          : notStarted
            ? "Accredito all'inizio"
            : pending
              ? 'Registro…'
              : 'Registra partecipazione'}
      </button>
      {result?.message && <span className={`badge ${credited ? 'success' : 'warn'}`}>{result.message}</span>}
    </div>
  );
}
