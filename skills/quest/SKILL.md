---
name: quest
description: >
  Overview completo del proyecto Quest. Arquitectura, rutas, convenciones, DB schema.
  Trigger: Cuando se necesita contexto general del proyecto, decisiones arquitectónicas, o entender la estructura.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Understanding project structure"
    - "Making architectural decisions"
    - "Onboarding to the codebase"
---

# Quest — Overview del Proyecto

## Visión
Quest es un sistema de crecimiento espiritual personal y comunitario. Funciona tanto para individuos (retos personales, stats, rachas) como para grupos (accountability, eventos, leaderboards). Inspirado en **YouVersion + Duolingo**.

### Principios
1. **Dual Mode:** Solo o en comunidad
2. **Todo reta a crecer:** Cada interacción impulsa crecimiento espiritual
3. **Gamificación profunda:** XP, niveles, badges, canjeo de puntos
4. **Penalizaciones flexibles:** Admin configura dinero o puntos
5. **Concentración real:** Timer persistente para oración

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Base de Datos | Supabase (PostgreSQL 17) |
| Auth | Supabase Auth (email/password, OAuth, biometric) |
| Nativo | Capacitor (iOS + Android) |
| Deploy | Vercel |
| Package Manager | pnpm |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/         ← Login, registro
│   │   └── login/
│   ├── (app)/          ← App principal (requiere auth)
│   │   ├── sustento-diario/  ← Lectura + oración
│   │   ├── feed/             ← Feed de actividad
│   │   ├── comunidad/        ← Leaderboard + social
│   │   ├── historial/        ← Historial personal
│   │   └── perfil/           ← Configuración usuario
│   └── (admin)/        ← Panel de administración (solo role=admin)
├── components/
│   └── ui/             ← shadcn/ui components
├── lib/
│   ├── supabase/       ← Client, server, admin clients
│   └── utils.ts        ← Helpers (timezone, formateo)
├── types/
│   └── definitions.ts  ← TypeScript types
└── middleware.ts        ← Auth + redirect logic
```

---

## Base de Datos (Tablas Existentes)

| Tabla | Filas | RLS | Propósito |
|-------|-------|-----|-----------|
| `perfiles` | 8 | ✅ | Usuarios (nombre, rol, avatar) |
| `planes_lectura` | 6 | ✅ | Planes de lectura bíblica |
| `capitulos_diarios` | 143 | ✅ | Capítulos asignados por fecha |
| `progreso_usuario` | 719 | ✅ | Check-ins de lectura + oración |
| `configuracion_app` | 1 | ✅ | Config global (modo penalización, timezone) |
| `penalizaciones` | 171 | ✅ | Sistema de penalizaciones |
| `actividad_comunidad` | 1,355 | ✅ | Feed de actividad |
| `suscripciones_push` | 1 | ✅ | Web push subscriptions |
| `comunidad_likes` | 5 | ✅ | Likes en feed |
| `comunidad_comentarios` | 1 | ✅ | Comentarios en feed |

### Enums
- `plan_estado`: inactivo, activo, proximo, completado
- `penalizacion_estado`: pendiente, pagada
- `tipo_actividad`: lectura_completada, oracion_completada

---

## Convenciones

### Naming
- **Archivos:** kebab-case (`daily-card.tsx`)
- **Componentes:** PascalCase (`DailyCard`)
- **Hooks:** camelCase con `use` prefix (`useStreak`)
- **Tablas DB:** snake_case en español (`progreso_usuario`)
- **CSS variables:** kebab-case (`--color-primary`)

### Imports
```typescript
// 1. React/Next
import { useState } from 'react';
import { redirect } from 'next/navigation';

// 2. Supabase
import { createClient } from '@/lib/supabase/client';

// 3. Components
import { Button } from '@/components/ui/button';

// 4. Utils/Types
import { getTodayInTimezone } from '@/lib/utils';
import type { ActionState } from '@/types/definitions';
```

### Commits
Usar skill `quest-commit` — conventional commits en español.
