'use client';

import { useState, useTransition } from 'react';
import { setDemoProfile } from '@/lib/actions/session';
import { DEMO_PROFILES } from '@/lib/profiles';

export function DemoProfileSwitcher({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? 'self');
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    const fd = new FormData();
    fd.set('profile', next);
    startTransition(async () => {
      await setDemoProfile(fd);
      // Mark that this profile change should surface the banner once, then do a
      // full reload so the new (httpOnly) cookie is applied even behind a proxy
      // cache — a soft RSC refresh can be served stale.
      try {
        sessionStorage.setItem('albo_imp_pending', next);
      } catch {
        /* ignore */
      }
      window.location.reload();
    });
  }

  return (
    <div className="demo-switcher" title="Anteprima demo: cambia il profilo con cui visualizzi la piattaforma">
      <span className="demo-switcher-label">Demo</span>
      <select
        name="profile"
        className="demo-switcher-select"
        value={value}
        aria-label="Profilo demo"
        disabled={pending}
        onChange={onChange}
      >
        <option value="self">Profilo reale (SSO)</option>
        {DEMO_PROFILES.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
