---
name: quest
description: >
  Overview completo del proyecto Quest. Arquitectura, rutas, convenciones, DB schema.
  Trigger: Cuando se necesita contexto general del proyecto, decisiones arquitectónicas, o entender la estructura.
license: MIT
metadata:
  author: quest
  version: "2.0"
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
| Auth | Supabase Auth (email/password) |
| Nativo | Capacitor (iOS + Android) — futuro |
| Deploy | Vercel |
| Package Manager | pnpm |

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/              ← Login, registro
│   │   └── login/
│   ├── (app)/               ← App principal (requiere auth)
│   │   ├── home/            ← Sustento diario (lectura + oración)
│   │   ├── feed/            ← Feed de actividad
│   │   ├── community/       ← Leaderboard + rankings
│   │   ├── history/         ← Historial con calendar
│   │   ├── challenges/      ← Retos personales + grupales
│   │   ├── badges/          ← Colección de badges
│   │   ├── debts/           ← Deudas, canjeo, recuperar racha
│   │   ├── oracion/         ← Timer de oración
│   │   └── perfil/          ← Perfil de usuario
│   └── (admin)/             ← Panel admin (futuro)
├── components/
│   ├── ui/                  ← shadcn/ui components
│   └── layout/              ← Layout components (nav, sidebar, header)
├── lib/
│   ├── supabase/            ← Client, server, admin clients
│   └── utils.ts             ← Helpers (timezone, formateo)
├── types/
│   ├── database.ts          ← Supabase auto-generated types
│   └── definitions.ts       ← Custom TypeScript types
└── middleware.ts             ← Auth + redirect logic
```

---

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/login` | Auth | Login con email/password |
| `/home` | App | Sustento diario — lectura bíblica + oración |
| `/feed` | App | Feed de actividad de la comunidad |
| `/community` | App | Rankings y leaderboard |
| `/history` | App | Historial personal con calendar view |
| `/challenges` | App | Retos personales y grupales |
| `/challenges/[id]` | App | Detalle de reto con participantes y progreso |
| `/badges` | App | Grid de badges (locked/unlocked) con XP bar |
| `/debts` | App | Balance, historial de deudas, canjeo de XP |
| `/oracion` | App | Timer de oración fullscreen |
| `/perfil` | App | Perfil de usuario, estadísticas |

---

## Base de Datos (Tablas)

### Core
| Tabla | RLS | Propósito |
|-------|-----|-----------| 
| `perfiles` | ✅ | Usuarios (nombre, rol, xp, nivel, max_streak) |
| `planes_lectura` | ✅ | Planes de lectura bíblica (estado, fechas, libro) |
| `capitulos_diarios` | ✅ | Capítulos asignados por fecha dentro de un plan |
| `progreso_usuario` | ✅ | Check-ins diarios: lectura + oración completada |
| `configuracion_app` | ✅ | Config clave-valor (modo penalización, tasa canjeo) |

### Gamificación
| Tabla | RLS | Propósito |
|-------|-----|-----------|
| `badges` | ✅ | Catálogo de 10 badges con criterio JSONB |
| `usuario_badges` | ✅ | Badges desbloqueados por cada usuario |
| `retos` | ✅ | Retos personales y grupales (criterio, fechas, XP) |
| `reto_participantes` | ✅ | Participación + progreso en retos |

### Penalizaciones y Deudas
| Tabla | RLS | Propósito |
|-------|-----|-----------|
| `penalizaciones` | ✅ | Penalizaciones por incumplimiento |
| `canjeos` | ✅ | Historial de canjes de XP por reducción de deuda |
| `recuperaciones_racha` | ✅ | Registro de rachas recuperadas |

### Social
| Tabla | RLS | Propósito |
|-------|-----|-----------|
| `actividad_comunidad` | ✅ | Feed de actividad (lecturas, oraciones) |
| `comunidad_likes` | ✅ | Likes en el feed |
| `comunidad_comentarios` | ✅ | Comentarios en el feed |
| `suscripciones_push` | ✅ | Web push subscription tokens |

### RPC Functions
| Función | Propósito |
|---------|-----------|
| `otorgar_xp(usuario_id, cantidad, motivo)` | Otorga XP y auto-levela |
| `calcular_nivel(xp)` | Calcula nivel según XP |
| `canjear_puntos(usuario_id, puntos, tasa)` | Canjea XP por reducción de deuda |
| `crear_plan_con_capitulos(...)` | Crea plan de lectura con capítulos |
| `programar_plan_siguiente(plan_id)` | Programa siguiente plan |
| `transicion_automatica_de_plan()` | Transición automática de planes |
| `registrar_penalizaciones_diarias()` | Registra penalizaciones del día |
| `aplicar_pago_a_usuario(usuario_id, monto)` | Aplica pago a deudas |
| `get_all_user_streaks()` | Obtiene rachas de todos los usuarios |
| `get_all_push_subscriptions()` | Obtiene suscripciones push |
| `admin_crear_perfil(...)` | Admin crea perfil de usuario |
| `admin_actualizar_rol(...)` | Admin actualiza rol de usuario |

### Enums
| Enum | Valores |
|------|---------|
| `plan_estado` | `inactivo`, `activo`, `proximo`, `completado` |
| `penalizacion_estado` | `pendiente`, `pagada` |
| `tipo_actividad` | `lectura_completada`, `oracion_completada` |

---

## Features Implementadas

### ✅ Sustento Diario (Home)
- Slide card con lectura bíblica del día
- Botones de check-in: lectura ✅ + oración ✅
- +50 XP por lectura, +50 XP por oración
- Racha de días consecutivos
- Progreso de plan (ej: 15/52 semanas)

### ✅ Timer de Oración
- Timer con cuenta regresiva
- Registro de minutos de oración

### ✅ Gamificación
- **XP y Niveles:** `perfiles.xp` y `perfiles.nivel`
- **Badges:** 10 badges con grid visual (locked/unlocked)
- **Rachas:** Cálculo consecutivo de días activos
- **Recuperar Racha:** Modal para gastar XP y recuperar racha perdida
- **Negociación XP:** `xp_propuesto` con trimmed mean para retos grupales

### ✅ Retos
- **Personales:** Usuario define reto con criterio, fechas, recompensa
- **Grupales:** Crear reto + invitar miembros (actualmente invita a todos)
- **Detalle:** Participantes, progreso porcentual, deadline, aceptar/rechazar

### ✅ Deudas y Canjeo
- Balance de deuda acumulada
- Historial de penalizaciones
- Canjeo de XP → reducción de deuda
- Botón "Recuperar Racha" (solo visible si racha rota)

### ✅ Comunidad
- Rankings por XP y racha
- Feed de actividad
- Likes y comentarios

### ✅ Historial
- Calendar view con días completados
- Estadísticas por mes/semana

---

## Convenciones

### Naming
- **Archivos:** kebab-case (`daily-card.tsx`)
- **Componentes:** PascalCase (`DailyCard`)
- **Hooks:** camelCase con `use` prefix (`useStreak`)
- **Tablas DB:** snake_case en español (`progreso_usuario`)
- **Rutas URL:** kebab-case en inglés (`/challenges`, `/debts`)
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

---

## Roadmap Pendiente

| Sub-fase | Feature | Prioridad |
|----------|---------|-----------|
| 3E | Sistema XP completo (auto level-up) | Alta |
| 3F | Grupos + Registro Público + Multi-Grupo | Crítica |
| 3G | Timezone configurable | Media |
| 3H | Feed Realtime + Social | Baja |
| 3I | Páginas de Administración | Alta |
| 3J | Sistema de Recompensas Configurable | Alta |
| 4 | Capacitor Native (iOS + Android) | — |
| 5 | App Stores + Monetización | — |
