---
name: react-best-practices
description: >
  Best practices React 19. Hooks modernos, composición, performance, error handling.
  Trigger: Al crear componentes React, manejar estado, o optimizar performance.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Creating React components"
    - "Managing state"
    - "Optimizing performance"
---

# React 19 — Best Practices

## Hooks Modernos

### useActionState (reemplaza useFormState)
```typescript
'use client';
import { useActionState } from 'react';

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  return (
    <form action={formAction}>
      <input name="email" />
      <button disabled={isPending}>{isPending ? 'Cargando...' : 'Login'}</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

### useOptimistic
```typescript
const [optimisticLikes, addOptimisticLike] = useOptimistic(
  likes,
  (state, newLike) => [...state, newLike]
);
```

### use() — Resource Reading
```typescript
// Lee promises en render (Server Components)
import { use } from 'react';
function UserProfile({ userPromise }) {
  const user = use(userPromise);
  return <h1>{user.nombre}</h1>;
}
```

---

## Component Patterns

### Composition over Props
```typescript
// ❌ Props drilling
<Card title="Reto" subtitle="7 días" icon="🔥" action={fn} />

// ✅ Composition
<Card>
  <CardHeader>
    <CardTitle>🔥 Reto</CardTitle>
    <CardDescription>7 días</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardAction onClick={fn}>Aceptar</CardAction>
</Card>
```

### Custom Hooks
```typescript
// hooks/use-streak.ts
export function useStreak(userId: string) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createClient();
    // fetch streak...
  }, [userId]);
  
  return { streak, loading };
}
```

---

## Performance

### React.memo — Solo cuando se necesita
```typescript
// Usar para componentes que re-renderizan frecuentemente con mismos props
const LeaderboardRow = memo(function LeaderboardRow({ user, rank }) {
  return <div>#{rank} {user.nombre}</div>;
});
```

### lazy + Suspense
```typescript
const AdminPanel = lazy(() => import('./admin-panel'));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <AdminPanel />
    </Suspense>
  );
}
```

### Keys correcto
```typescript
// ❌ Index como key
items.map((item, i) => <Item key={i} />)

// ✅ ID único
items.map((item) => <Item key={item.id} />)
```

---

## Error Boundaries

```typescript
// src/app/(app)/error.tsx
'use client';

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
```

---

## State Management (Quest)

| Scope | Solución |
|-------|----------|
| Local component | `useState` |
| Form state | `useActionState` |
| Optimistic UI | `useOptimistic` |
| Cross-component | React Context + `useReducer` |
| Server state | Supabase queries (Server Components) |
| Global client | Zustand (si se necesita, no instalado aún) |

### Context Pattern
```typescript
const TimerContext = createContext<TimerState | null>(null);

export function TimerProvider({ children }) {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  return (
    <TimerContext.Provider value={{ state, dispatch }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
```
