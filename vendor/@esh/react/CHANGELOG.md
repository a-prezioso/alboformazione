# Changelog — @esh/react

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

- bcf65e4: Prima release pubblica (0.1.0) del design system ESH.

  ### @esh/tokens
  - Sorgente JSON con 3 brand (ESH Purple / ESH Orange / ESH Neutral) × 2 modi (light / dark).
  - Build multi-target: CSS custom props, SCSS vars, ES modules, TypeScript types.
  - Scope semantici completi: color, typography, spacing, radius, elevation, motion, z-index.
  - Theming runtime via `data-brand` + `data-theme` sull'elemento root. Nessun rebuild.

  ### @esh/core
  - 40+ web component Lit: Button, Input, Checkbox, Radio, Select, Slider, Switch, Tag, Badge, Progress, Spinner, Toast, Tooltip, Tabs, Accordion, Breadcrumb, Stepper, Pagination, Navigation Bar, Dialog, Drawer, Menu, Card, Avatar, Divider, Icon, Icon Button, List, Data Table, FAB.
  - Struttura canonica per ogni componente: `.ts` + `.styles.ts` + `.types.ts` + `.test.ts` + `README.md` + `index.ts`.
  - `custom-elements.json` generato da `@custom-elements-manifest/analyzer` per IDE support e auto-docs.
  - Full a11y: ARIA, focus-visible, keyboard-nav, screen-reader ready.

  ### @esh/react
  - Wrapper React ufficiale via `@lit/react`.
  - Eventi custom tipati (`onEshChange`, `onEshClick`, …) con `CustomEvent.detail` inferito.
  - Side-effect import che registra automaticamente tutti i custom element.
  - Documentato il pattern SSR per Next.js / Remix.

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
  - @esh/core@1.0.0

Seguiamo [Keep a Changelog](https://keepachangelog.com/) e [SemVer](https://semver.org/).

## [Unreleased]

### Added

- Wrapper React per tutti i 40+ web component di `@esh/core` via `@lit/react`.
- Eventi custom tipati (`onEshChange`, `onEshClick`, …) con `CustomEvent` detail inferito.
- Side-effect import che registra automaticamente tutti i custom element.
- SSR: documentato il pattern `'use client'` + dynamic import per Next.js.

## [0.1.0] — TBD

Prima release pubblicata insieme a `@esh/core@0.1.0`.
