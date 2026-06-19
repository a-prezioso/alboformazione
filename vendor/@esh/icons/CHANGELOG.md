# @esh/icons — Changelog

## 1.2.1

### Patch

- Hotfix CI per release `1.2.0` mai pubblicata (artifacts size > 1GB). Nessun cambio funzionale. Bump linked.

## 1.2.0

### Note

- Nessun cambio funzionale. Bump allineato col gruppo `linked` (tokens/core/icons/react/presentation) per release coerente del DS in occasione di `@esh/presentation@1.2.0`.

## 1.1.0

### Note

- Nessun cambio funzionale. Bump allineato col gruppo `linked` (tokens/core/icons/react/presentation) per release coerente del DS.

## 1.0.0

### Minor Changes

- e1b1f60: ### Palette v5 + Focus management + DX hardening

  #### Tokens (breaking visual, non breaking API)
  - Nuova **palette v5**: grey/orange/yellow primitives ritarati
  - **AGID primary** cambiato da nero a `orange.700` (AAA 8.4:1 su bianco)
  - **AGID dark primary**: `orange.200` (AAA 11.0:1 su nero)
  - **Webapp primary**: `orange.400` (brand puro)
  - Nuovi token: `color-accent`, `color-on-accent`, `color-accent-container`, `color-on-accent-container` per tutti i brand
  - AGID esteso: `color-outline-strong` per ipovisioni
  - Deprecato: `color-accent-magenta`, `color-accent-purple` (rimossi)
  - `color-secondary-*` mantenuto come alias di `color-accent-*` per backward compat (rimuoveremo in v1.0)
  - Nuovo export: `@esh/tokens/auto-theme` — helper `installAutoTheme()` / `setThemePreference()` per dark mode auto-detect
  - Nuovo export: `@esh/tokens/css/fonts` (CDN) e `@esh/tokens/css/fonts-selfhost` (self-host template)

  #### Core components
  - Nuovo helper `FocusTrap` in `src/internal/focus-trap.ts` (riusabile)
  - **Dialog**: refactored per usare FocusTrap (DRY)
  - **Drawer**: aggiunto focus trap + restore focus (prima assente — WCAG 2.4.3 fix)
  - **Tooltip**: arrow decorativa ora renderizzata in template (prima solo CSS)
  - **Accordion**: animazione collasso ora robusta (max-height + visibility, no più dipendenza da grid-template-rows animation)
  - **Stepper**: render connector fra step + allineamento verticale circle+label

  #### Quality / DX
  - Commitlint + husky + lint-staged: pre-commit lint, commit-msg Conventional Commits
  - CODEOWNERS: review auto-assignata per pattern file
  - SECURITY.md: vulnerability disclosure policy
  - Dark mode auto-detect (`prefers-color-scheme` listener)
  - Docs: FONTS.md con strategie CDN vs self-host

### Patch Changes

- Updated dependencies [bcf65e4]
- Updated dependencies [e1b1f60]
  - @esh/tokens@1.0.0

## [0.1.0] — 2026-04-21

### Added

- `<esh-icon>` web component con registry centrale
- 22 icone iniziali (home, search, check, close, chevron-_, info, warning, success, error, settings, user, bell, plus, minus, trash, edit, download, upload, menu, arrow-_)
