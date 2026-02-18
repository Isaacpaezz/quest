---
name: supabase-best-practices
description: >
  Best practices para Supabase en Quest. Queries, RLS, Edge Functions, Realtime.
  Trigger: Al trabajar con queries, políticas de seguridad, o funciones edge.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Writing Supabase queries"
    - "Database security"
    - "Edge Functions"
---

# Supabase — Best Practices

## Query Patterns

### Select con Tipos
```typescript
const { data, error } = await supabase
  .from('perfiles')
  .select('id, nombre, avatar_url, rol')
  .eq('id', userId)
  .single();

if (error) throw error;
// data es tipado automáticamente
```

### Insert con Return
```typescript
const { data, error } = await supabase
  .from('retos')
  .insert({
    creador_id: userId,
    tipo: 'personal',
    titulo: 'Leer 7 días',
    criterio: { action: 'lectura', count: 7, period: 'week' },
  })
  .select()
  .single();
```

### Upsert (insert or update)
```typescript
await supabase.from('progreso_usuario').upsert({
  usuario_id: userId,
  fecha: today,
  lectura_completada: true,
}, { onConflict: 'usuario_id,fecha' });
```

---

## RLS Policies

### Principios
1. **Deny by default** — RLS habilitado = todo denegado sin policy
2. **Least privilege** — solo lo mínimo necesario
3. **Row-level, no table-level** — filtrar por `auth.uid()`
4. **Service role bypasses RLS** — usar con extremo cuidado

### Patterns Comunes

```sql
-- Usuarios leen sus propios datos
CREATE POLICY "own_data_select" ON tabla
  FOR SELECT USING (auth.uid() = usuario_id);

-- Usuarios insertan sus propios datos
CREATE POLICY "own_data_insert" ON tabla
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Admin lee todo
CREATE POLICY "admin_all" ON tabla
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Datos públicos (read-only para todos autenticados)
CREATE POLICY "authenticated_read" ON tabla
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## Realtime

```typescript
// Suscribirse a cambios en feed
const channel = supabase
  .channel('feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'actividad_comunidad'
  }, (payload) => {
    // Agregar nueva actividad al feed
    addToFeed(payload.new);
  })
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);
```

---

## Edge Functions

```typescript
// supabase/functions/check-streaks/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Lógica de verificación de rachas...
  return new Response(JSON.stringify({ ok: true }));
});
```

---

## Performance Tips

- Usar `.select('col1, col2')` — nunca `select('*')` en producción
- Crear índices para queries frecuentes
- Usar `.range()` para paginación
- Cache con `revalidatePath` en Server Actions
- Batch operations cuando sea posible
