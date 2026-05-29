---
name: quest-ui
description: >
  Design System de Quest. Paleta de colores, tipografía, tokens, componentes custom, safe areas.
  Trigger: Al crear o modificar componentes UI, estilos, o patrones visuales.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating UI components"
    - "Styling elements"
    - "Design system decisions"
---

# Quest UI — Design System

## Paleta de Colores

> [!NOTE]
> La paleta final se definirá en Fase 2 (Pencil.dev). Estos son los tokens actuales.

### Light Mode
```css
--primary: 243 75% 59%;        /* Indigo vibrante */
--secondary: 210 40% 96.1%;
--accent: 210 40% 96.1%;
--destructive: 346 87% 43%;
--background: 210 40% 98%;
--foreground: 222 47% 11%;
```

### Dark Mode (oklch)
```css
--primary: oklch(0.922 0 0);
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
--card: oklch(0.205 0 0);
--destructive: oklch(0.704 0.191 22.216);
```

---

## Tipografía

| Uso | Fuente | Peso |
|-----|--------|------|
| Display / Títulos | **Outfit** | 600-800 |
| Body / Texto | **Inter** | 400-600 |
| Monospace / Código | JetBrains Mono | 400 |

### Escala
| Token | Tamaño | Uso |
|-------|--------|-----|
| `text-xs` | 12px | Labels, captions |
| `text-sm` | 14px | Body secundario |
| `text-base` | 16px | Body principal |
| `text-lg` | 18px | Subtítulos |
| `text-xl` | 20px | Títulos de sección |
| `text-2xl` | 24px | Títulos de página |
| `text-3xl` | 30px | Hero, numbers grandes |

---

## Tokens de Spacing

```css
--radius: 1rem;
--radius-sm: calc(var(--radius) - 4px);   /* 12px */
--radius-md: calc(var(--radius) - 2px);   /* 14px */
--radius-lg: var(--radius);               /* 16px */
--radius-xl: calc(var(--radius) + 4px);   /* 20px */
```

### Spacing Scale
- `4px` → spacing-1 (micro gaps)
- `8px` → spacing-2 (inline spacing)
- `12px` → spacing-3 (small padding)
- `16px` → spacing-4 (standard padding)
- `24px` → spacing-6 (section gaps)
- `32px` → spacing-8 (large gaps)

---

## Componentes Custom (a crear en Fase 2)

| Componente | Propósito |
|-----------|-----------|
| `StreakCounter` | Muestra racha actual con animación 🔥 |
| `DailyCard` | Card de lectura/oración del día |
| `ProgressBar` | Barra de progreso animada |
| `LeaderboardRow` | Fila de usuario en leaderboard |
| `XPBadge` | Indicador de nivel y XP |
| `TimerDisplay` | Cronómetro de oración (circular) |
| `ChallengeCard` | Card de reto (personal o grupal) |
| `EventCard` | Card de evento con RSVP |
| `PenaltyBadge` | Indicador de deuda/penalización |

---

## Safe Areas (PWA + Capacitor)

```css
/* Utilities en globals.css */
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
.pt-safe { padding-top: env(safe-area-inset-top); }
```

- Bottom navigation: SIEMPRE usar `pb-safe` para iPhone con notch
- Header: SIEMPRE usar `pt-safe` para status bar
- Modals: considerar `safe-area-inset-*` en todos los lados

---

## Motion Guidelines

| Tipo | Duración | Easing | Uso |
|------|----------|--------|-----|
| Micro | 150ms | ease-out | Hover, focus, toggle |
| Standard | 250ms | ease-in-out | Modals, drawers |
| Emphasis | 400ms | spring | Celebraciones, badges |
| Page | 300ms | ease-out | Transiciones de ruta |

### Principios
- Animaciones sutiles, no distractoras
- Celebrar logros con animaciones más llamativas (confetti, pulse)
- Reducir motion si `prefers-reduced-motion` está activo
