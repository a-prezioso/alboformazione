'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

/**
 * Transient "you are viewing as …" banner. Shows ONLY right after an actual
 * profile switch (the switcher sets a sessionStorage flag before reloading),
 * auto-dismisses after 5s, and can be closed with the X. It does not re-appear
 * on subsequent navigation while impersonating.
 */
export function ImpersonationBanner({
  active,
  profileKey,
  name,
  membershipLabel,
  isAdmin
}: {
  active: boolean;
  profileKey: string;
  name: string;
  membershipLabel: string;
  isAdmin: boolean;
}) {
  const [visible, setVisible] = useState(false);

  // Decide visibility from the "just switched" flag set by the switcher before
  // reload. Does NOT consume the flag here, so React StrictMode's double-invoke
  // in dev stays consistent (both runs see the flag).
  useEffect(() => {
    if (!active) {
      try {
        sessionStorage.removeItem('albo_imp_pending');
      } catch {
        /* ignore */
      }
      setVisible(false);
      return;
    }
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem('albo_imp_pending');
    } catch {
      /* ignore */
    }
    setVisible(pending === profileKey);
  }, [active, profileKey]);

  // While visible: consume the flag (so a plain refresh won't re-show it) and
  // auto-dismiss after 5s.
  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.removeItem('albo_imp_pending');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!active || !visible) return null;

  return (
    <div className="impersonation-banner" role="status">
      <Icon name="account" size={16} />
      <span>
        Stai visualizzando la piattaforma come <strong>{name}</strong> ({membershipLabel}
        {isAdmin ? ' · Admin' : ''}) — profilo demo.
      </span>
      <button
        type="button"
        className="impersonation-close"
        aria-label="Chiudi avviso"
        onClick={() => setVisible(false)}
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
