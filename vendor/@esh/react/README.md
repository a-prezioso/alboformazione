# `@esh/react`

Wrapper React ufficiale dei web component di [`@esh/core`](../core/README.md).

## Perché un wrapper?

I web component funzionano in React, ma con limiti:
- React (fino alla 18) passa tutte le prop come attributi stringa, non come property
- gli eventi custom (`esh-change`) non si collegano con `onEshChange` JSX
- la tipizzazione TypeScript è inesistente (`<esh-button variant="primary">` → `any`)

`@lit/react` genera un componente React per ogni custom element che:
- mappa prop camelCase → property Lit correttamente
- tipizza gli eventi custom come handler (`onEshChange: (e: CustomEvent<...>) => void`)
- forwarda la `ref` al DOM element nativo

## Installazione

```bash
pnpm add @esh/react @esh/core @esh/tokens react react-dom
```

## Uso

```tsx
import '@esh/tokens/brands.css';
import '@esh/tokens/theme.css';
import { EshButton, EshInput, EshDialog, EshToastStack, EshToast } from '@esh/react';

export function App() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <EshInput
        label="Email"
        type="email"
        required
        onEshChange={(e) => console.log('changed', e.detail.value)}
      />
      <EshButton variant="primary" onEshClick={() => setOpen(true)}>
        Apri dialog
      </EshButton>

      <EshDialog open={open} heading="Conferma" onEshHide={() => setOpen(false)}>
        <p>Sei sicuro?</p>
      </EshDialog>
    </>
  );
}
```

## Eventi disponibili

Ogni componente espone handler tipati corrispondenti ai custom event. Vedi
`src/index.ts` per la mappatura completa. Convenzione: `onEsh<Name>`.

| Componente | Eventi |
|---|---|
| `EshButton` / `EshIconButton` / `EshFab` | `onEshClick` |
| `EshInput` / `EshSlider` | `onEshInput`, `onEshChange`, `onEshBlur` |
| `EshCheckbox` / `EshSwitch` / `EshRadioGroup` / `EshSelect` | `onEshChange` |
| `EshTag` | `onEshRemove` |
| `EshDialog` / `EshDrawer` | `onEshShow`, `onEshHide` |
| `EshToast` | `onEshClose` |
| `EshTabs` | `onEshTabChange` |
| `EshAccordionItem` | `onEshToggle` |
| `EshMenu` / `EshDataTable` | `onEshSelect`, `onEshSort` |
| `EshPagination` | `onEshPageChange` |

## SSR

I web component richiedono `window` per registrarsi. In Next.js / Remix:

```tsx
// app/layout.tsx
'use client';
import '@esh/tokens/brands.css';
import '@esh/tokens/theme.css';

// Import dinamico SOLO client-side
import dynamic from 'next/dynamic';
const Providers = dynamic(() => import('./providers'), { ssr: false });
```

In `providers.tsx` fai `import '@esh/react'` normale.

## Peer dependencies

- `react >= 18`
- `react-dom >= 18`
- `@esh/core` e `@esh/tokens` (workspace)
