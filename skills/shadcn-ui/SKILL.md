---
name: shadcn-ui
description: >
  Componentes shadcn/ui en Quest. Instalación, theming, CVA patterns, forms con Zod.
  Trigger: Al agregar componentes UI, formularios, o trabajar con el sistema de componentes.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Adding UI components"
    - "Working with forms"
    - "Using shadcn components"
---

# shadcn/ui — Componentes

## Componentes Instalados (12)

| Componente | Uso en Quest |
|-----------|-------------|
| `badge` | Estados, niveles, roles |
| `button` | Acciones principales |
| `card` | Cards de lectura, retos, eventos |
| `collapsible` | Secciones expandibles |
| `dialog` | Modals de confirmación |
| `input` | Formularios |
| `label` | Labels de form |
| `select` | Dropdowns |
| `skeleton` | Loading states |
| `sonner` | Toast notifications |
| `table` | Tablas admin |
| `textarea` | Text input largo |

---

## Agregar Componentes

```bash
npx shadcn@latest add <component>
# Ejemplo:
npx shadcn@latest add sheet drawer tabs avatar progress
```

### Componentes Recomendados (Fase 2)
```bash
npx shadcn@latest add sheet        # Bottom sheets (mobile)
npx shadcn@latest add tabs         # Navigation tabs
npx shadcn@latest add avatar       # User avatars
npx shadcn@latest add progress     # Progress bars
npx shadcn@latest add dropdown-menu # Context menus
npx shadcn@latest add alert-dialog  # Confirmaciones
npx shadcn@latest add switch       # Toggles
```

---

## CVA (Class Variance Authority)

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        streak: "bg-amber-500 text-white",
        level: "bg-indigo-500 text-white",
        penalty: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

---

## Form Pattern (Zod + Server Action)

```typescript
'use client';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChallengeForm({ action }) {
  const [state, formAction, pending] = useActionState(action, null);
  
  return (
    <form action={formAction}>
      <Label htmlFor="titulo">Título del reto</Label>
      <Input id="titulo" name="titulo" required />
      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creando...' : 'Crear Reto'}
      </Button>
    </form>
  );
}
```

---

## Theming

Los componentes usan CSS variables automáticamente:
- `bg-primary` → `var(--primary)`
- `text-muted-foreground` → `var(--muted-foreground)`
- `border-border` → `var(--border)`

Para override: aplicar clases directamente
```tsx
<Card className="bg-gradient-to-br from-primary/10 to-accent/10">
```

---

## Convenciones Quest

- Componentes shadcn en `src/components/ui/`
- Componentes custom Quest en `src/components/` (root)
- NUNCA modificar archivos en `ui/` directamente — crear wrappers si es necesario
- Usar `cn()` de `lib/utils` para merge de clases
