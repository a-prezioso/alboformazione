'use client';

import { useEffect, useState } from 'react';

/** Live countdown to an event start time. */
export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (now === null) return <span className="muted small">…</span>;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return <span className="badge live">In corso / iniziato</span>;

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const Box = ({ n, l }: { n: number; l: string }) => (
    <div style={{ textAlign: 'center', minWidth: 56 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary, #bc2c00)' }}>
        {String(n).padStart(2, '0')}
      </div>
      <div className="muted small">{l}</div>
    </div>
  );

  return (
    <div className="row" style={{ gap: 14 }}>
      {d > 0 && <Box n={d} l="giorni" />}
      <Box n={h} l="ore" />
      <Box n={m} l="min" />
      <Box n={s} l="sec" />
    </div>
  );
}
