'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/** Auto-applying catalog filters (no submit button). Search is debounced. */
export function CatalogFilters({
  categories,
  initial
}: {
  categories: string[];
  initial: { q?: string; type?: string; category?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q ?? '');
  const [type, setType] = useState(initial.type ?? 'all');
  const [category, setCategory] = useState(initial.category ?? 'all');
  const first = useRef(true);

  function apply(next: { q?: string; type?: string; category?: string }) {
    const params = new URLSearchParams();
    const qq = next.q ?? q;
    const tt = next.type ?? type;
    const cc = next.category ?? category;
    if (qq) params.set('q', qq);
    if (tt && tt !== 'all') params.set('type', tt);
    if (cc && cc !== 'all') params.set('category', cc);
    const qs = params.toString();
    router.push(qs ? `/catalogo?${qs}` : '/catalogo');
  }

  // Debounced search
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => apply({ q }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="card row wrap" style={{ gap: 12, alignItems: 'end' }}>
      <div className="field" style={{ margin: 0, flex: 1, minWidth: 200 }}>
        <label>Cerca</label>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titolo o argomento…" />
      </div>
      <div className="field" style={{ margin: 0, width: 170 }}>
        <label>Tipo</label>
        <select
          className="select"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            apply({ type: e.target.value });
          }}
        >
          <option value="all">Tutti</option>
          <option value="ondemand">Differita</option>
          <option value="live">Live</option>
        </select>
      </div>
      <div className="field" style={{ margin: 0, width: 210 }}>
        <label>Categoria</label>
        <select
          className="select"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            apply({ category: e.target.value });
          }}
        >
          <option value="all">Tutte</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {(q || type !== 'all' || category !== 'all') && (
        <button
          className="btn ghost"
          onClick={() => {
            setQ('');
            setType('all');
            setCategory('all');
            router.push('/catalogo');
          }}
        >
          Azzera
        </button>
      )}
    </div>
  );
}
