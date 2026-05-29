# Quest AI Agent Skills

> **Quest** — Sistema de crecimiento espiritual personal y comunitario.
> Next.js 16 + Supabase + Tailwind v4 + Capacitor

## Project Overview

| Aspecto | Detalle |
|---------|---------|
| **Framework** | Next.js 16 (App Router) |
| **Lenguaje** | TypeScript |
| **Estilos** | Tailwind CSS v4 + shadcn/ui |
| **Base de Datos** | Supabase (PostgreSQL 17) |
| **Auth** | Supabase Auth (SSR) |
| **Nativo** | Capacitor (iOS + Android) |
| **Package Manager** | pnpm |
| **Deploy** | Vercel |

## Tech Stack

- **React 19** — Server Components, useActionState, useOptimistic
- **Tailwind v4** — CSS-first config, @theme inline, oklch
- **shadcn/ui** — 12 componentes instalados (badge, button, card, dialog, etc.)
- **Supabase SSR** — createServerClient + createBrowserClient
- **Zod** — Validación de schemas
- **Lucide React** — Iconos
- **Sonner** — Toast notifications
- **web-push** — Push notifications (PWA)

## Development

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Servidor de desarrollo
pnpm build            # Build de producción
pnpm lint             # ESLint
```

## Skills Directory

### Tier 1 — Fundación

| Skill | Descripción | Auto-invoke |
|-------|-------------|-------------|
| [quest](skills/quest/SKILL.md) | Overview del proyecto, arquitectura, convenciones | Understanding project structure, architectural decisions |
| [quest-ui](skills/quest-ui/SKILL.md) | Design system: paleta, tipografía, tokens, componentes | Creating UI components, styling |
| [frontend-design](skills/frontend-design/SKILL.md) | Principios de diseño moderno, motion, color theory | Designing layouts, visual experiences |
| [nextjs-app-router](skills/nextjs-app-router/SKILL.md) | Next.js 16 patterns: Server/Client Components, Actions | Working with routing, pages, layouts |
| [tailwind-v4](skills/tailwind-v4/SKILL.md) | Tailwind v4 CSS-first, @theme inline, oklch | Working with Tailwind CSS, themes |
| [shadcn-ui](skills/shadcn-ui/SKILL.md) | Componentes shadcn/ui, CVA, forms con Zod | Adding UI components, forms |
| [react-best-practices](skills/react-best-practices/SKILL.md) | React 19 hooks, composition, performance | Creating components, managing state |

### Tier 2 — Backend

| Skill | Descripción | Auto-invoke |
|-------|-------------|-------------|
| [supabase-auth](skills/supabase-auth/SKILL.md) | Auth SSR, middleware, OAuth, biometric | Authentication, login, sessions |
| [supabase-best-practices](skills/supabase-best-practices/SKILL.md) | Queries, RLS, Realtime, Edge Functions | Supabase queries, security |
| [supabase-postgres](skills/supabase-postgres/SKILL.md) | Schema design, migrations, indexes, functions | Database schema, migrations |
| [pwa-expert](skills/pwa-expert/SKILL.md) | Service workers, push notifications, offline | PWA features, push, offline |

### Tier 3 — Nativo + Monetización

| Skill | Descripción | Auto-invoke |
|-------|-------------|-------------|
| [capacitor-native](skills/capacitor-native/SKILL.md) | iOS/Android builds, plugins, native features | Building native apps, device features |
| [appstore-readiness](skills/appstore-readiness/SKILL.md) | App Store + Play Store requirements, ASO | Store submissions |
| [monetization-strategy](skills/monetization-strategy/SKILL.md) | Freemium, RevenueCat, AdMob, donations | Payments, subscriptions |

### Tier 4 — Workflow + Docs

| Skill | Descripción | Auto-invoke |
|-------|-------------|-------------|
| [quest-commit](skills/quest-commit/SKILL.md) | Commits profesionales conventional-commits (español) | Creating git commits |
| [quest-pr](skills/quest-pr/SKILL.md) | Pull requests con template estructurado | Creating pull requests |
| [quest-docs](skills/quest-docs/SKILL.md) | Documentación técnica y de usuario | Writing documentation |

### Utilidades

| Skill | Descripción |
|-------|-------------|
| [skill-creator](skills/skill-creator/SKILL.md) | Template para crear nuevos skills |
| [skill-sync](skills/skill-sync/SKILL.md) | Sincronizar AGENTS.md con skills/ |

## Auto-Invoke Rules

Los skills se invocan automáticamente cuando se detectan los triggers listados en la columna "Auto-invoke" de cada skill. Los triggers se definen en el frontmatter YAML de cada `SKILL.md` bajo `metadata.auto_invoke`.

## File Structure

```
src/
├── app/
│   ├── (auth)/          → Login, registro
│   ├── (app)/           → App principal (auth required)
│   │   ├── sustento-diario/  → Lectura + oración
│   │   ├── feed/             → Feed de actividad
│   │   ├── comunidad/        → Leaderboard + social
│   │   ├── historial/        → Historial personal
│   │   └── perfil/           → Configuración usuario
│   └── (admin)/         → Panel admin
├── components/
│   └── ui/              → shadcn/ui
├── lib/
│   ├── supabase/        → Client, server, admin
│   └── utils.ts         → Helpers
├── types/
│   └── definitions.ts   → TypeScript types
└── middleware.ts         → Auth redirect
```
