---
name: supabase-postgres
description: >
  PostgreSQL patterns for Supabase. Schema design, migrations, indexes, functions.
  Trigger: Al diseñar tablas, crear migraciones, o escribir funciones SQL.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Designing database schema"
    - "Creating migrations"
    - "Writing SQL functions"
---

# Supabase PostgreSQL — Schema & Migrations

## Quest DB Schema

### Proyecto
- **ID:** `yrmphoaxnmyqdmwluvro`
- **Region:** us-east-2
- **PostgreSQL:** 17.6
- **RLS:** Habilitado en todas las tablas

---

## Convenciones de Naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Tablas | snake_case, español, plural | `progreso_usuario` |
| Columnas | snake_case, español | `lectura_completada` |
| Primary keys | `id UUID DEFAULT gen_random_uuid()` | — |
| Foreign keys | `tabla_id` | `usuario_id`, `plan_id` |
| Timestamps | `created_at TIMESTAMPTZ DEFAULT now()` | — |
| Enums | snake_case, tipo descriptivo | `plan_estado` |
| Indexes | `idx_tabla_columna` | `idx_progreso_fecha` |

---

## Migrations

### Crear via MCP
```
mcp_supabase-mcp-server_apply_migration
  project_id: "yrmphoaxnmyqdmwluvro"
  name: "add_xp_to_perfiles"
  query: "ALTER TABLE perfiles ADD COLUMN xp INTEGER DEFAULT 0;"
```

### Reglas
- SIEMPRE crear migraciones para cambios de schema
- NUNCA modificar datos directamente en producción sin migración
- Nombres descriptivos en snake_case
- Un cambio lógico por migración
- Incluir rollback en comentario cuando sea posible

---

## Indexes Recomendados

```sql
-- Queries frecuentes
CREATE INDEX idx_progreso_usuario_fecha ON progreso_usuario(usuario_id, fecha);
CREATE INDEX idx_actividad_created ON actividad_comunidad(created_at DESC);
CREATE INDEX idx_penalizaciones_usuario ON penalizaciones(usuario_id, estado);
CREATE INDEX idx_retos_tipo ON retos(tipo, fecha_fin);
```

---

## Functions & Triggers

```sql
-- Función para calcular racha
CREATE OR REPLACE FUNCTION calcular_racha(p_usuario_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_racha INTEGER := 0;
  v_fecha DATE;
BEGIN
  FOR v_fecha IN
    SELECT DISTINCT fecha FROM progreso_usuario
    WHERE usuario_id = p_usuario_id
    ORDER BY fecha DESC
  LOOP
    IF v_fecha = CURRENT_DATE - v_racha THEN
      v_racha := v_racha + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN v_racha;
END;
$$ LANGUAGE plpgsql;
```

---

## Tips
- Usar `gen_random_uuid()` para UUIDs (no requiere extensión en PG 17)
- Usar `TIMESTAMPTZ` siempre (no `TIMESTAMP`)
- Usar `JSONB` para datos flexibles (criterios de retos, configuración)
- Habilitar RLS inmediatamente al crear tabla
