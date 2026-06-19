'use client';

import { useState } from 'react';

/** Uploads a file to /api/admin/upload and writes the returned key into a
 * hidden input (so it submits with the surrounding form). */
export function Uploader({
  name,
  label,
  accept,
  defaultValue
}: {
  name: string;
  label: string;
  accept?: string;
  defaultValue?: string | null;
}) {
  const [key, setKey] = useState(defaultValue ?? '');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('uploading');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('upload failed');
      const data = (await res.json()) as { key: string };
      setKey(data.key);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input type="file" accept={accept} onChange={onChange} className="input" />
      <input type="hidden" name={name} value={key} readOnly />
      {key && (
        <span className="muted small">
          {status === 'uploading' ? 'Caricamento…' : `File: ${key}`}
        </span>
      )}
      {status === 'error' && <span className="badge warn">Errore upload</span>}
    </div>
  );
}
