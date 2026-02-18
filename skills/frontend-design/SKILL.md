---
name: frontend-design
description: >
  Principios de diseño web moderno para Quest. Estética, composición, motion, color theory.
  Trigger: Al tomar decisiones de diseño, crear layouts, o definir experiencias visuales.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Designing layouts"
    - "Creating visual experiences"
    - "UI/UX decisions"
---

# Frontend Design — Principios

## Filosofía Visual

Quest debe sentirse como una app **premium, cálida y motivante**. No es una app religiosa "vieja" — es moderna, audaz, y emocionante como Duolingo o Strava.

### Pilares
1. **Bold pero Cálido:** Colores vibrantes con tonos cálidos que inspiran paz y motivación
2. **Espacioso:** Generous whitespace, breathing room entre elementos
3. **Celebratorio:** Los logros se sienten como victorias — animaciones, confetti, progress rings
4. **Accesible:** Contraste WCAG AA mínimo, touch targets 44px+, reduced motion support

---

## Composición

### Visual Hierarchy
1. **Números grandes primero:** Rachas, XP, niveles — los números son protagonistas
2. **Cards con profundidad:** Sombras sutiles, bordes redondeados, hover states
3. **Iconos expresivos:** Lucide React como base, emojis para badges/reacciones
4. **Progressive disclosure:** Mostrar lo esencial, ocultar lo complejo

### Layout Principles
- **Mobile-first:** Diseñar para 375px, escalar hacia arriba
- **Bottom navigation:** 5 tabs (Sustento, Feed, Comunidad, Historial, Perfil)
- **Sticky headers:** Con blur/glass effect
- **Pull-to-refresh:** En feeds y listas
- **Gestures:** Swipe para acciones rápidas

---

## Color Theory (Espiritual/Wellness)

| Emoción | Color | Uso |
|---------|-------|-----|
| Paz, confianza | Indigo/Blue | Primary |
| Energía, celebración | Amber/Gold | Streaks, achievements |
| Crecimiento | Green | Progress, completion |
| Urgencia | Red/Rose | Penalties, deadlines |
| Neutralidad | Slate/Gray | Text, borders |

---

## Micro-Interactions

| Acción | Feedback |
|--------|----------|
| Completar lectura | ✅ Check animado + XP popup |
| Completar racha | 🔥 Fire animation + counter increment |
| Nuevo badge | 🏆 Modal con confetti |
| Timer tick | Pulse sutil en display |
| Like en feed | ❤️ Heart bounce |
| Nuevo nivel | 🎉 Full-screen celebration |

---

## Do's y Don'ts

### ✅ Do
- Usar gradientes sutiles en headers y cards
- Animar transiciones entre estados
- Celebrar CADA logro del usuario
- Usar skeleton loaders (no spinners)
- Dar feedback háptico en acciones importantes

### ❌ Don't
- Fondos blancos planos sin textura
- Iconos genéricos sin personalidad
- Transiciones instantáneas (siempre animar)
- Modals para todo (usar sheets/drawers en mobile)
- Texto largo sin jerarquía visual
