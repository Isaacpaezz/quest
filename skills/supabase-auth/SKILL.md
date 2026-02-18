---
name: supabase-auth
description: >
  Autenticación con Supabase en Next.js. SSR client, middleware, OAuth, biometric.
  Trigger: Al trabajar con login, registro, sesiones, o protección de rutas.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Working with authentication"
    - "Login or registration"
    - "Session management"
---

# Supabase Auth — Next.js SSR

## Setup en Quest

### Client Browser
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Client Server
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Client Admin (Service Role)
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

---

## Middleware Pattern

```typescript
// src/middleware.ts
const publicPaths = ['/login', '/registro'];

export async function middleware(request) {
  const supabase = createServerClient(/* ... cookies ... */);
  const { data: { user } } = await supabase.auth.getUser();
  
  const isPublic = publicPaths.some(p => request.nextUrl.pathname.startsWith(p));
  
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (user && isPublic) {
    return NextResponse.redirect(new URL('/sustento-diario', request.url));
  }
}
```

---

## Auth Methods

| Método | Estado | Plugin |
|--------|--------|--------|
| Email/Password | ✅ Activo | — |
| Google OAuth | 🔜 Fase 2 | — |
| Apple Sign In | 🔜 Fase 4 | `@capacitor-community/apple-sign-in` |
| Biometric | 🔜 Fase 4 | `capacitor-native-biometric` |

---

## Reglas RLS

- TODAS las tablas deben tener RLS habilitado
- Usuarios solo pueden leer/escribir sus propios datos
- Admin (role='admin') puede leer/escribir todo
- Usar `auth.uid()` en policies

```sql
-- Ejemplo: usuarios solo ven su progreso
CREATE POLICY "Users read own progress"
  ON progreso_usuario FOR SELECT
  USING (auth.uid() = usuario_id);
```
