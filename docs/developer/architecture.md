# Arquitectura — Quest

## Overview

Quest es una aplicación web construida con **Next.js 16 (App Router)** y **Supabase** como backend. La arquitectura sigue el patrón de Server Components de React, con Server Actions para mutaciones.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────┐
│                   Cliente                        │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │ Server       │  │ Client Components      │   │
│  │ Components   │  │ ('use client')         │   │
│  │ (SSR)        │  │ - Formularios          │   │
│  │ - Páginas    │  │ - Modales              │   │
│  │ - Layouts    │  │ - Interacciones        │   │
│  └──────┬───────┘  └──────────┬─────────────┘   │
│         │                     │                  │
│         │  Server Actions     │  Client SDK      │
│         │                     │                  │
│  ┌──────▼─────────────────────▼─────────────┐   │
│  │          Middleware (Auth)                 │   │
│  └──────────────────┬────────────────────────┘   │
└─────────────────────┼────────────────────────────┘
                      │
           ┌──────────▼──────────┐
           │     Supabase        │
           │  ┌───────────────┐  │
           │  │ PostgreSQL 17 │  │
           │  │ + RLS         │  │
           │  │ + RPC Funcs   │  │
           │  └───────────────┘  │
           │  ┌───────────────┐  │
           │  │ Auth          │  │
           │  │ (Email/Pass)  │  │
           │  └───────────────┘  │
           │  ┌───────────────┐  │
           │  │ Storage       │  │
           │  │ (Avatars)     │  │
           │  └───────────────┘  │
           └─────────────────────┘
```

---

## Route Groups

```
src/app/
├── (auth)/          ← Rutas públicas (login, registro)
├── (app)/           ← Rutas protegidas (requieren auth)
└── (admin)/         ← Rutas admin (futuro)
```

### Middleware
`src/middleware.ts` intercepta todas las requests:
1. Refresh del token de Supabase
2. Si el usuario NO está autenticado → redirect a `/login`
3. Si está autenticado y visita `/login` → redirect a `/home`

---

## Patrón de Componentes

### Server Components (default)
- **Archivos `page.tsx`** — Fetch de datos en el servidor
- Usan `createClient()` de `@/lib/supabase/server`
- Pasan datos como props a Client Components
- No tienen estado ni event handlers

### Client Components (`'use client'`)
- **Archivos `*-client.tsx`** — Interactividad
- Reciben datos como props del Server Component padre
- Manejan formularios, modales, estados locales
- Usan `useActionState` para Server Actions con feedback

### Server Actions
- **Archivos `actions.ts`** — Mutaciones
- Usan `'use server'`
- Validan datos, interactúan con Supabase, revalidan paths
- Retornan `ActionState` con `{ status, message }`

---

## Patrón de Layout

### Layout Components
| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `GlassHeader` | `components/layout/glass-header.tsx` | Header translúcido con título dinámico |
| `PillNav` | `components/layout/pill-nav.tsx` | Nav móvil inferior (pill-shaped tabs) |
| `DesktopSidebar` | `components/layout/desktop-sidebar.tsx` | Sidebar para desktop |
| `MenuPanel` | `components/layout/menu-panel.tsx` | Drawer lateral con perfil y navegación |

### Responsividad
- **Mobile-first:** La app prioriza la experiencia móvil
- **Desktop:** Sidebar izquierda + contenido centrado
- **Breakpoint principal:** `md:` (768px)

---

## Modelo de Datos

### Relaciones principales
```
perfiles ──────────────────────── auth.users (1:1)
    │
    ├── progreso_usuario ──── capitulos_diarios ──── planes_lectura
    ├── penalizaciones
    ├── canjeos
    ├── recuperaciones_racha
    ├── usuario_badges ──── badges
    ├── reto_participantes ──── retos
    ├── actividad_comunidad
    │       ├── comunidad_likes
    │       └── comunidad_comentarios
    └── suscripciones_push
```

### Row Level Security (RLS)
- **Todas las tablas** tienen RLS habilitado
- Los usuarios solo pueden ver/editar sus propios datos
- RPCs con `SECURITY DEFINER` para operaciones cross-user (rankings, admin)

---

## Despliegue

| Capa | Servicio |
|------|----------|
| Frontend + API | Vercel |
| Base de datos | Supabase (hosted) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |

### CI/CD
- GitHub Actions en push a `main`
- Steps: `pnpm install` → `pnpm lint` → `pnpm build`
- Vercel auto-deploy en merge a `main`
