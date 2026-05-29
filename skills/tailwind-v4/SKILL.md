---
name: tailwind-v4
description: >
  Tailwind CSS v4 CSS-first configuration. @theme inline, @custom-variant, oklch.
  Trigger: Al trabajar con estilos, CSS variables, o configuración de Tailwind.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Working with Tailwind CSS"
    - "Styling with CSS variables"
    - "Configuring themes"
---

# Tailwind CSS v4 — CSS-First Config

## Reglas Críticas

- **NO existe `tailwind.config.ts`** — toda la config está en `globals.css`
- Usar `@theme inline` para definir tokens
- Usar `@custom-variant` para dark mode
- Usar oklch para dark mode colors
- Importar `tw-animate-css` para animaciones

---

## Estructura de globals.css

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --primary: 243 75% 59%;
  /* ... light mode variables ... */
}

.dark {
  --primary: oklch(0.922 0 0);
  /* ... dark mode oklch variables ... */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --color-primary: var(--primary);
  /* ... token mappings ... */
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}

@layer utilities {
  .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
  .pt-safe { padding-top: env(safe-area-inset-top); }
}
```

---

## @theme inline

Mapea CSS variables a tokens de Tailwind:

```css
@theme inline {
  --color-primary: var(--primary);          /* → bg-primary, text-primary */
  --color-background: var(--background);    /* → bg-background */
  --radius-lg: var(--radius);              /* → rounded-lg */
}
```

---

## oklch Color Space

Dark mode usa oklch para colores más perceptualmente uniformes:

```css
.dark {
  --background: oklch(0.145 0 0);     /* Negro profundo */
  --foreground: oklch(0.985 0 0);     /* Blanco suave */
  --primary: oklch(0.922 0 0);        /* Blanco cálido */
  --destructive: oklch(0.704 0.191 22.216); /* Rojo */
}
```

### Formato oklch
- `oklch(L C H)` — Lightness, Chroma, Hue
- L: 0 (negro) → 1 (blanco)
- C: 0 (gris) → 0.4 (máxima saturación)
- H: 0-360 (ángulo de color)

---

## Agregar CSS Variables Nuevas

1. Definir en `:root` (light) y `.dark` (dark)
2. Mapear en `@theme inline` con prefix `--color-`
3. Usar en Tailwind: `bg-nueva-variable`, `text-nueva-variable`

```css
:root { --success: 142 71% 45%; }
.dark { --success: oklch(0.696 0.17 162.48); }

@theme inline {
  --color-success: var(--success);
}
```

→ `bg-success`, `text-success`, `border-success`

---

## Patterns Quest

```html
<!-- Card con hover effect -->
<div class="rounded-xl bg-card p-6 shadow-sm hover:shadow-md transition-shadow">

<!-- Gradient header -->
<div class="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">

<!-- Safe area padding -->
<nav class="pb-safe fixed bottom-0 ...">
```
