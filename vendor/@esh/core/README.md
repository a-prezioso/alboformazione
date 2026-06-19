# @esh/core

> Web component UI del **ESH Design System**. Funzionano nativamente in HTML, Thymeleaf, Angular, React (19+), Vue, Svelte.

---

## 📦 Installazione

```bash
npm install @esh/tokens @esh/core
```

`@esh/tokens` è peer dependency: installalo insieme.

---

## 🚀 Uso

### Step 1 — importa i token CSS

```html
<link rel="stylesheet" href="node_modules/@esh/tokens/dist/css/all.css">
<html data-brand="business" data-theme="light">
```

### Step 2 — importa i componenti

**Tutti insieme:**
```js
import '@esh/core';
```

**Tree-shaken (consigliato):**
```js
import '@esh/core/button';
import '@esh/core/input';
```

### Step 3 — usali

```html
<esh-button variant="primary" size="md">Salva</esh-button>
<esh-input label="Email" type="email" placeholder="you@example.com"></esh-input>
<esh-card variant="outlined">
  <h3 slot="header">Titolo</h3>
  <p>Contenuto</p>
</esh-card>
```

---

## 🧩 Componenti disponibili (v0.1.0)

| Component | Status | Import path |
|---|---|---|
| `<esh-button>` | ✅ | `@esh/core/button` |
| `<esh-input>` | ✅ | `@esh/core/input` |
| `<esh-card>` | ✅ | `@esh/core/card` |

**Fase 4** aggiungerà: checkbox, radio, switch, select, slider, textarea, dialog, modal, drawer, toast, tooltip, progress, spinner, tabs, breadcrumb, stepper, pagination, menu, navigation-bar, fab, accordion, list, divider, avatar, data-table, chip, KPI-card, sidebar, header, icon-system.

---

## 🎨 Theming

Tutti i componenti ereditano automaticamente da `[data-brand][data-theme]`. Non serve JS.

```html
<html data-brand="business" data-theme="light">
  <!-- tutti gli esh-* sono Business Light -->
  <section data-brand="agid" data-theme="dark">
    <!-- dentro qui sono AGID Dark -->
    <esh-button>AGID dark</esh-button>
  </section>
</html>
```

---

## 🔧 Framework integration

### Angular

```ts
// app.module.ts
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}

// main.ts
import '@esh/tokens/css';
import '@esh/core';
```

### React (19+)

Funziona nativamente. Per React ≤18 servono wrapper `@esh/react` (non ancora pubblicato).

### Vue 3

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
export default {
  plugins: [
    vue({ template: { compilerOptions: { isCustomElement: (t) => t.startsWith('esh-') } } })
  ]
};
```

---

## 📜 Licenza

Proprietario. Copyright © 2026 Elite Software House S.r.l.
