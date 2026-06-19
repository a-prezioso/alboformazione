# @esh/icons

> Libreria icone del **ESH Design System** come web component `<esh-icon>`.

## 📦 Installazione

```bash
npm install @esh/icons
```

## 🚀 Uso

```html
<script type="module" src="node_modules/@esh/icons/dist/index.js"></script>

<esh-icon name="home"></esh-icon>
<esh-icon name="search" size="20px"></esh-icon>
<esh-icon name="check" label="Completato"></esh-icon>
```

Le icone usano `currentColor`: ereditano il colore dal parent.

## 🧩 Icone disponibili (v0.1.0)

`home`, `search`, `check`, `close`, `chevron-down`, `chevron-right`, `info`, `warning`, `success`, `error`, `settings`, `user`, `bell`, `plus`, `minus`, `trash`, `edit`, `download`, `upload`, `menu`, `arrow-right`, `arrow-left`.

Per aggiungere un'icona: apri una PR che aggiorni `src/icon-registry.ts`.

## 📜 Licenza

Proprietario. Copyright © 2026 Elite Software House S.r.l.
