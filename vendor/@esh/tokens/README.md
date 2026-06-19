# @esh/tokens

> Design token di **ESH Design System** — source of truth per colori, tipografia, spacing, radius, shadow, motion.

Il pacchetto espone i token in più formati: **CSS**, **SCSS**, **JS/TS**, **JSON**. Scegli quello più adatto al tuo workflow.

---

## 📦 Installazione

```bash
npm install @esh/tokens
```

## 🚀 Uso

### CSS (più comune)

**Drop-in:** tutto incluso (primitivi + tipografia + spacing + motion + 6 scope brand/theme).

```css
@import "@esh/tokens/css";
```

**Granulare:** importa solo quello che ti serve.

```css
@import "@esh/tokens/css/primitives";
@import "@esh/tokens/css/typography";
@import "@esh/tokens/css/spacing";
@import "@esh/tokens/css/motion";
@import "@esh/tokens/css/business-light";  /* solo il brand che ti serve */
@import "@esh/tokens/css/business-dark";
```

### SCSS

```scss
@import "@esh/tokens/scss";

.my-component {
  padding: map-get($esh-spacing, "4");
  border-radius: map-get($esh-radius, "md");
}
```

### JavaScript / TypeScript

```ts
import { tokens, primitives, spacing } from '@esh/tokens';

console.log(tokens.semantic['business-light']['color-primary']); // '#BC2C00'
console.log(spacing[4]); // '16px'
```

### JSON (build tools, Style Dictionary, etc.)

```ts
import tokens from '@esh/tokens/json';
```

---

## 🎨 Sistema brand + theme

Il pacchetto definisce **3 brand × 2 theme = 6 scope**, tutti first-class:

| Scope | Selettore CSS | Primary |
|---|---|---|
| `business-light` (default) | `:root` o `[data-brand="business"][data-theme="light"]` | Arancio `#BC2C00` |
| `business-dark` | `[data-brand="business"][data-theme="dark"]` | Arancio `#FF662D` |
| `agid-light` | `[data-brand="agid"][data-theme="light"]` | Nero `#262322` |
| `agid-dark` | `[data-brand="agid"][data-theme="dark"]` | Bianco `#FFFFFF` |
| `webapp-light` | `[data-brand="webapp"][data-theme="light"]` | Arancio `#F04800` |
| `webapp-dark` | `[data-brand="webapp"][data-theme="dark"]` | Arancio `#FF9366` |

### Switch runtime

```html
<!-- Tutta la pagina in AGID dark -->
<html data-brand="agid" data-theme="dark">

<!-- Solo una section in AGID dark dentro una pagina Business -->
<section data-brand="agid" data-theme="dark">
  ...
</section>
```

I componenti che leggono `var(--color-primary)` ricevono automaticamente il colore dello scope più vicino. **Zero JS di theming**.

---

## 🏛️ Architettura dei token

### Livello 1 — Primitivi (immutabili)

Scale di colore crude: `--grey-50` → `--grey-950`, `--orange-*`, ecc.  
**Non usare direttamente nei componenti.**

### Livello 2 — Semantici (mutabili per scope)

Nomi che descrivono l'intento: `--color-primary`, `--color-surface`, `--color-success`.  
**Usa solo questi nei componenti.**

### Livello 3 — Altri token

Spacing (`--spacing-1` → `--spacing-12`), radius (`--radius-xs` → `--radius-full`), elevation, motion, breakpoints, z-index.

---

## 🛠️ Build

```bash
pnpm build   # rigenera dist/ da src/tokens.json
```

**Modifica solo `src/tokens.json`.** Tutti gli output in `dist/` sono rigenerati automaticamente.

---

## 📜 Licenza

Proprietario. Copyright © 2026 Elite Software House S.r.l.
