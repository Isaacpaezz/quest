# Guía de Instalación — Quest

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | 22+ |
| pnpm | 10+ |
| Git | 2.40+ |

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Isaacpaezz/quest.git
cd quest
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 4. Iniciar servidor de desarrollo
```bash
pnpm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Servidor de desarrollo (hot reload) |
| `pnpm build` | Build de producción |
| `pnpm lint` | Ejecutar ESLint |
| `pnpm start` | Iniciar servidor de producción |

---

## Supabase

### Base de datos
El proyecto usa Supabase como backend. Las tablas y funciones ya están creadas en el proyecto de Supabase remoto.

### Generar tipos TypeScript
Si se hacen cambios al esquema de la base de datos:
```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.ts
```

### Clientes Supabase
- **Client-side:** `src/lib/supabase/client.ts` — para componentes `'use client'`
- **Server-side:** `src/lib/supabase/server.ts` — para Server Components y Server Actions
- **Middleware:** `src/middleware.ts` — para auth redirect

---

## Deploy

### Vercel
El proyecto se despliega en Vercel con las siguientes variables de entorno:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Rama principal
- `main` — producción
- Feature branches → PR → merge a main

---

## IDE Setup

### Skills para AI Agents
El proyecto tiene 19 skills en `skills/` que guían a los AI agents. El skill principal es `quest/SKILL.md` que contiene la overview completa del proyecto.

### Extensiones recomendadas
- ESLint
- Tailwind CSS IntelliSense
- Prettier
