# Quest - Crecimiento Espiritual

Aplicación para el crecimiento espiritual diario a través de lectura bíblica y oración, potenciada por comunidad y gamificación.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4 + shadcn/ui
- **Base de Datos:** Supabase (PostgreSQL 17)
- **Auth:** Supabase Auth
- **Deployment:** Vercel
- **Native:** Capacitor (iOS + Android)

## Requisitos

- Node.js 20+
- pnpm 9+

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Configurar variables de entorno:
   ```bash
   cp .env.example .env.local
   # Llenar con tus credenciales de Supabase
   ```
4. Iniciar servidor de desarrollo:
   ```bash
   pnpm dev
   ```

## Skills (AI Agents)

Este proyecto utiliza skills definidos en `AGENTS.md` para guiar a los agentes de IA.

- **Fase 1:** Skills de fundación (Quest UI, Frontend Design, Next.js, Tailwind v4)
- **Fase 2:** Skills de backend (Supabase Auth, Postgres)
- **Fase 3:** Skills nativos (Capacitor, App Store)

## Estructura del Proyecto

- `src/app`: Rutas de la aplicación (App Router)
- `src/components`: Componentes reutilizables (shadcn/ui + custom)
- `src/lib`: Utilidades y configuración de Supabase
- `src/types`: Definiciones de tipos TypeScript
- `supabase`: Migraciones y configuración local
- `docs`: Documentación detallada del proyecto
