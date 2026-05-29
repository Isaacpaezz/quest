# Sistema de XP — Documentación Técnica

## Overview

El sistema de XP (experiencia) recompensa a los usuarios por completar actividades diarias y retos. Todos los valores de XP son **configurables por grupo** desde el panel de admin.

## Arquitectura

```
┌──────────────────────┐
│   Admin Panel        │   Edita valores en configuracion_app
│   /admin/configuracion│   (xp_lectura, xp_oracion, etc.)
└─────────┬────────────┘
          │ upsert
          ▼
┌──────────────────────┐
│   configuracion_app  │   Tabla por grupo (clave/valor)
│   (Supabase)         │
└─────────┬────────────┘
          │ read
          ▼
┌──────────────────────┐
│   getXpConfig()      │   Lee config del grupo activo del user
│   src/lib/xp-helpers │   Fallback: xp_presets → DEFAULT_XP_CONFIG
└─────────┬────────────┘
          │ config values
          ▼
┌──────────────────────┐
│   Server Actions     │   home/actions.ts, challenges/actions.ts
│   (grant XP)         │   Llaman grantXp() con valores de config
└─────────┬────────────┘
          │ RPC
          ▼
┌──────────────────────┐
│   otorgar_xp()       │   Actualiza perfiles.xp + miembros_grupo.xp
│   (PostgreSQL RPC)   │   Inserta en historial_xp, calcula nivel
└──────────────────────┘
```

## Database

### Tablas involucradas

| Tabla | Propósito |
|-------|-----------|
| `configuracion_app` | Valores XP por grupo (clave/valor, ej: `xp_lectura=40`) |
| `xp_presets` | Presets fallback (solo/grupo) — se usan si no hay config de grupo |
| `historial_xp` | Log de cada XP otorgado (usuario, cantidad, motivo, referencia, grupo) |
| `perfiles` | XP global y nivel del usuario |
| `miembros_grupo` | XP y nivel por grupo |

### Claves en `configuracion_app`

| Clave | Default | Descripción |
|-------|---------|-------------|
| `xp_lectura` | 40 | XP al completar lectura diaria |
| `xp_oracion` | 40 | XP al completar oración |
| `xp_oracion_bonus` | 20 | XP bonus por oración larga |
| `xp_oracion_bonus_minutos` | 10 | Minutos mínimos para obtener bonus |
| `xp_devocional_completo` | 25 | XP bonus por completar lectura + oración en el mismo día |
| `xp_reto_completado` | 100 | XP al completar un reto personal |
| `xp_reto_grupal_base` | 100 | XP base para retos grupales |
| `xp_racha_multiplicador` | 10 | XP extra por día de racha (XP × días) |
| `xp_racha_cap` | 100 | Máximo XP por bonus de racha |

### RPC `otorgar_xp()`

```sql
otorgar_xp(
  p_usuario_id UUID,
  p_cantidad INTEGER,
  p_motivo TEXT,
  p_referencia_id TEXT,
  p_grupo_id UUID
)
```

- Actualiza `perfiles.xp` y `perfiles.nivel` (global)
- Si `p_grupo_id` no es null, también actualiza `miembros_grupo.xp` y `miembros_grupo.nivel`
- Inserta registro en `historial_xp`
- Retorna `{ nuevo_xp, nuevo_nivel, subio_nivel }`

## Implementation

### Archivos clave

| Archivo | Función |
|---------|---------|
| `src/lib/xp-helpers.ts` | `getXpConfig()`, `grantXp()`, `calculateStreakBonus()`, niveles |
| `src/app/(app)/home/actions.ts` | Lectura/oración → XP con guards anti-duplicado |
| `src/app/(app)/challenges/actions.ts` | Retos → XP (personal/grupal/negociado) |
| `src/app/(app)/admin/configuracion/actions.ts` | Guardar config XP desde admin |
| `src/app/(app)/admin/configuracion/_components/settings-form.tsx` | UI de configuración XP |

### Flujo de lectura → XP

```
1. Usuario marca lectura ✅
2. registrarProgresoLecturaAction()
3. Guard: ¿ya se otorgó XP para este capítulo? (historial_xp)
4. Si NO → grantXp(lectura_completada)
5. Calcular streak bonus → grantXp(racha_bonus)
6. ¿Oración ya completada hoy? → grantXp(devocional_completo)
```

### Flujo de oración → XP

```
1. Timer de oración finaliza
2. actualizarProgresoOracionAction()
3. Guard: ¿ya se otorgó XP para esta oración? (historial_xp)
4. Si NO → grantXp(oracion_completada)
5. ¿Segundos >= umbral configurable? → grantXp(oracion_bonus)
6. ¿Lectura ya completada hoy? → grantXp(devocional_completo)
```

### Prevención de duplicados

Antes de otorgar XP, se consulta `historial_xp`:

```typescript
const { data: xpYaOtorgado } = await supabase
  .from('historial_xp')
  .select('id')
  .eq('usuario_id', user.id)
  .eq('motivo', 'lectura_completada')
  .eq('referencia_id', String(capituloId))
  .limit(1)

if (!xpYaOtorgado?.length) {
  // Otorgar XP...
}
```

### `getXpConfig()` — Orden de resolución

1. **`configuracion_app`** del grupo activo del usuario (prioridad más alta)
2. **`xp_presets.solo`** — preset fallback para modo sin grupo
3. **`DEFAULT_XP_CONFIG`** — constantes hardcoded como último recurso

### Niveles y umbrales

| Nivel | XP requerido | Nombre |
|-------|-------------|--------|
| 1 | 0 | Semilla |
| 2 | 100 | Aprendiz |
| 3 | 500 | Peregrino |
| 4 | 1,000 | Explorador |
| 5 | 1,500 | Valiente |
| 6 | 2,500 | Guerrero |
| 7 | 3,500 | Campeón |
| 8 | 5,000 | Leyenda |
| 9 | 7,500 | Profeta |
| 10 | 10,000 | Apóstol |

## Testing

### Verificar config del grupo

```sql
SELECT clave, valor FROM configuracion_app
WHERE grupo_id = '<GRUPO_ID>'
AND clave LIKE 'xp_%'
ORDER BY clave;
```

### Verificar XP otorgado

```sql
SELECT cantidad, motivo, referencia_id, created_at
FROM historial_xp
WHERE usuario_id = '<USER_ID>'
ORDER BY created_at DESC
LIMIT 20;
```

### Verificar anti-duplicado

Completar la misma lectura dos veces → el XP solo debe aparecer una vez en `historial_xp`.
