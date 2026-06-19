'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/Icon';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export function UserMenu({
  name,
  email,
  membershipLabel,
  isAdmin
}: {
  name: string;
  email: string;
  membershipLabel: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" aria-hidden="true">
          {initials(name)}
        </span>
        <span className="user-chip-text">
          <span className="user-chip-name">{name}</span>
          <span className="user-chip-role small muted">{isAdmin ? 'Amministratore' : membershipLabel}</span>
        </span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div className="menu-pop" role="menu">
          <div className="menu-head">
            <div className="user-chip-name">{name}</div>
            <div className="small muted">{email}</div>
          </div>
          <Link href="/account" className="menu-row" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="account" size={18} />
            <span>Il mio account</span>
          </Link>
          <a href="/oauth2/sign_out" className="menu-row" role="menuitem">
            <Icon name="logout" size={18} />
            <span>Esci</span>
          </a>
        </div>
      )}
    </div>
  );
}
