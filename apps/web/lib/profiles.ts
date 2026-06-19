// Shared constants safe for both server and client bundles (no server-only imports).

export const DEMO_PROFILE_COOKIE = 'albo_demo_profile';

export type MembershipStatus = 'associato' | 'non_associato';

// Demo profiles selectable via the switcher (map to seeded users).
// NB: use dedicated demo accounts (NOT the presenter's real SSO email) so the
// switcher behaves identically regardless of who is logged in.
export const DEMO_PROFILES: Array<{ key: string; email: string; label: string }> = [
  { key: 'associato', email: 'mario.rossi@demo.it', label: 'Iscritto associato' },
  { key: 'non_associato', email: 'giulia.verdi@demo.it', label: 'Iscritto non associato' },
  { key: 'formatore', email: 'prof.bianchi@demo.it', label: 'Formatore' },
  { key: 'operatore', email: 'operatore@demo.it', label: 'Operatore di segreteria' },
  { key: 'admin', email: 'admin@demo.it', label: 'Amministratore' }
];
