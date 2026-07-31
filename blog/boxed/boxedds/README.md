# Boxed Design System

Company-grade design system for **Boxed Systems** product UI: tokens, accessible components, and progressive JS — no build step required.

## What modern product teams get

| Layer | Contents |
|--------|----------|
| **Foundations** | Color (brand + semantic + status), type scale, spacing (4px), radius, elevation, motion, z-index, breakpoints, dark/light themes |
| **Layout** | Container, stack, cluster, grid, split, aspect ratios |
| **Components** | Buttons, forms, selection controls, badges/tags, avatars, cards, alerts, toasts, modals, dropdowns, tooltips, tabs, accordion, navbar, breadcrumbs, tables, pagination, progress, spinners, skeletons, steppers, upload, search, empty states, code/kbd, brand panels |
| **Behaviors** | Theme toggle, modal, dropdown, tabs, accordion, toast API, copy-to-clipboard, form validation demo |
| **A11y** | Focus rings, skip link, ARIA patterns, keyboard nav, reduced motion, status not color-only |

## Structure

```
design-system/
├── index.html              # Living style guide
├── css/
│   ├── design-system.css   # Entry (imports below)
│   ├── tokens.css          # Design tokens
│   ├── base.css            # Reset + base type
│   ├── layout.css          # Layout primitives
│   ├── components.css      # Component library
│   ├── utilities.css       # Optional utilities
│   └── docs.css            # Style-guide chrome only
└── js/
    └── design-system.js    # Interactive behaviors + BoxedDS API
```

## Run

From the repo root:

```bash
npx serve .
```

Open:

- Marketing demo: `http://localhost:3000/`
- Design system: `http://localhost:3000/design-system/`

## Product usage

```html
<html data-theme="dark">
  <head>
    <link rel="stylesheet" href="design-system/css/design-system.css">
  </head>
  <body>
    <button class="bx-btn bx-btn--primary">Request Specs</button>
    <script src="design-system/js/design-system.js" defer></script>
  </body>
</html>
```

### Class conventions

- **`bx-`** — public design system (use in product)
- **`data-bx-*`** — progressive enhancement hooks
- **`ds-`** — documentation chrome only (do not ship)

### JavaScript API

```js
BoxedDS.theme.set('light')   // 'dark' | 'light' | 'system'
BoxedDS.theme.toggle()
BoxedDS.toast({ title: 'Saved', description: '…', variant: 'success' })
BoxedDS.modal.open('my-modal-id')
BoxedDS.modal.close()
```

### Theme

Set `data-theme="dark|light"` on `<html>`. Preference is stored in `localStorage` under `bx-theme`.

## Design principles

1. **Tokens first** — never hard-code brand hex in product components; use semantic variables.
2. **Hard edges** — surface radius is `0`. No soft corners, pill chrome, or teal glow focus rings.
3. **Solid faces over soft chrome** — contrast blocks, not decorative shadows or blur.
4. **One primary action** per view.
5. **Accessible defaults** — hard rectangular `:focus-visible` rings; keyboard-usable.
6. **Zero-build** — plain CSS/JS; migrate class API into React/Vue when needed.
7. **Brand continuity** — same teal/yellow/ink language as the marketing scroll demo.

## Extending

1. Add tokens in `tokens.css`.
2. Add components in `components.css` with `bx-` prefix and state variants.
3. Document them in `index.html` with a preview + class names.
4. Prefer `data-bx-*` attributes for new behaviors in `design-system.js`.
