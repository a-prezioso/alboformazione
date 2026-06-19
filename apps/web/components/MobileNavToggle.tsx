'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';

/** Hamburger (mobile only) that toggles the off-canvas sidebar via `body.nav-open`,
 * plus a dimming overlay that closes it. */
export function MobileNavToggle() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="hamburger icon-btn"
        aria-label="Apri menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="menu" size={22} />
      </button>
      {open && <div className="nav-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}
    </>
  );
}
