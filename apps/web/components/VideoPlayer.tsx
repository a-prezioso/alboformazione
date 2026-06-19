'use client';

import { useEffect, useRef, useState } from 'react';
import { updateProgress } from '@/lib/actions/progress';

/**
 * On-demand player with viewing-progress tracking (§3.3).
 * Tracks the furthest-watched fraction and sends a heartbeat every few seconds
 * and on pause. When the minimum viewing percentage is reached the parent test
 * gate unlocks (page revalidates on completion).
 */
export function VideoPlayer({
  contentId,
  src,
  initialPct,
  initialPositionSec,
  minViewPct
}: {
  contentId: string;
  src: string | null;
  initialPct: number;
  initialPositionSec: number;
  minViewPct: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const maxPctRef = useRef(initialPct);
  const dirtyRef = useRef(false);
  const [pct, setPct] = useState(initialPct);
  const [completed, setCompleted] = useState(initialPct >= minViewPct);

  async function flush(positionSec: number) {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    try {
      const res = await updateProgress({ contentId, watchedPct: maxPctRef.current, positionSec });
      setPct(res.watchedPct);
      if (res.completed && !completed) setCompleted(true);
    } catch {
      /* heartbeat best-effort */
    }
  }

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (initialPositionSec > 0) v.currentTime = initialPositionSec;

    const onTime = () => {
      if (!v.duration || Number.isNaN(v.duration)) return;
      const frac = Math.round((v.currentTime / v.duration) * 100);
      if (frac > maxPctRef.current) {
        maxPctRef.current = frac;
        dirtyRef.current = true;
        setPct(frac);
        if (frac >= minViewPct && !completed) setCompleted(true);
      }
    };
    const onPause = () => flush(v.currentTime);

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onPause);
    const interval = setInterval(() => flush(v.currentTime), 5000);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onPause);
      clearInterval(interval);
      flush(v.currentTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack">
      {src ? (
        <video
          ref={ref}
          src={src}
          controls
          style={{ width: '100%', borderRadius: 'var(--radius-lg, 12px)', background: '#000', aspectRatio: '16/9' }}
        />
      ) : (
        <div className="card muted" style={{ aspectRatio: '16/9', display: 'grid', placeItems: 'center' }}>
          Video non disponibile in questo ambiente demo.
        </div>
      )}
      <div>
        <div className="row between small" style={{ marginBottom: 6 }}>
          <span className="muted">Avanzamento visione</span>
          <span>
            <strong>{pct}%</strong> <span className="muted">/ minimo {minViewPct}%</span>
          </span>
        </div>
        <div className="progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        {completed && (
          <p className="badge success" style={{ marginTop: 10 }}>
            Soglia di visione raggiunta — test di sblocco disponibile
          </p>
        )}
      </div>
    </div>
  );
}
