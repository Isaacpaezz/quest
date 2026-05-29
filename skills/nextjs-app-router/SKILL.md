---
name: nextjs-app-router
description: >
  Patrones y best practices para Next.js 16 App Router. Server/Client Components, Server Actions, Middleware.
  Trigger: Al trabajar con rutas, layouts, Server Actions, o patrones Next.js.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Working with Next.js routing"
    - "Creating pages or layouts"
    - "Server Actions or API routes"
---

# Next.js 16 App Router — Patrones

## Server vs Client Components

### Server Components (default)
```typescript
// src/app/(app)/feed/page.tsx — NO 'use client'
import { createClient } from '@/lib/supabase/server';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('actividad_comunidad').select('*');
  return <FeedList items={data} />;
}
```

### Client Components
```typescript
// src/components/timer-display.tsx
'use client';
import { useState, useEffect } from 'react';

export function TimerDisplay() {
  const [seconds, setSeconds] = useState(0);
  // ...interactive logic
}
```

### Reglas
- **Server por defecto** — solo agregar `'use client'` cuando se necesite interactividad
- **Fetch en Server** — las queries a Supabase van en Server Components
- **Props down** — pasar datos de Server → Client via props
- **No hooks en Server** — useState, useEffect SOLO en Client Components

---

## Server Actions

```typescript
// src/app/(app)/sustento-diario/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const schema = z.object({ planId: z.string().uuid() });

export async function completarLectura(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Datos inválidos' };
  
  // DB operation...
  revalidatePath('/sustento-diario');
  return { success: true };
}
```

> [!WARNING]
> Server Actions NO funcionan con Capacitor static export.
> Para features nativas, migrar a client-side Supabase calls.

---

## Route Groups

```
src/app/
├── (auth)/        ← NO requiere auth
│   ├── login/
│   └── layout.tsx  ← Layout sin nav
├── (app)/         ← REQUIERE auth (middleware redirect)
│   ├── layout.tsx  ← Layout con bottom nav
│   └── sustento-diario/
└── (admin)/       ← REQUIERE role=admin
```

---

## Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
  // 1. Refresh session
  // 2. Redirect unauthenticated to /login
  // 3. Redirect authenticated from /login to /sustento-diario
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

---

## Loading & Error States

```typescript
// src/app/(app)/feed/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return <Skeleton className="h-48 w-full rounded-xl" />;
}

// src/app/(app)/feed/error.tsx
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <p>Algo salió mal</p>
      <button onClick={reset}>Reintentar</button>
    </div>
  );
}
```

---

## Metadata

```typescript
// src/app/layout.tsx
export const metadata = {
  title: 'Quest - Crecimiento Espiritual',
  description: 'Crece espiritualmente en comunidad',
  manifest: '/manifest.json',
  themeColor: '#4F46E5',
};
```
