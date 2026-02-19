# Base de Datos — Quest

## Overview

Quest usa **Supabase (PostgreSQL 17)** con Row Level Security (RLS) habilitado en todas las tablas. Las tablas y nombres de columnas usan **snake_case en español**.

---

## Tablas

### `perfiles`
Datos del usuario. Se crea al registrarse via trigger o RPC admin.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID (PK) | — | Referencia a `auth.users(id)` |
| `nombre_usuario` | TEXT | — | Nombre visible del usuario |
| `rol` | TEXT | `'miembro'` | `admin` o `miembro` |
| `xp` | INTEGER | `0` | Puntos de experiencia acumulados |
| `nivel` | INTEGER | `1` | Nivel actual del usuario |
| `max_streak` | INTEGER | `0` | Racha máxima alcanzada |
| `grupo_activo_id` | UUID (FK) | `null` | → `grupos(id)` — Grupo activo del usuario |
| `creado_en` | TIMESTAMPTZ | `now()` | Fecha de registro |

---

### `grupos`
Grupos de la aplicación. Cada grupo tiene su propia configuración y miembros.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID (PK) | auto | — |
| `nombre` | TEXT | — | Nombre del grupo |
| `descripcion` | TEXT | `null` | Descripción opcional |
| `codigo_invitacion` | TEXT | `null` | Código para unirse (generado con `nanoid`) |
| `creador_id` | UUID (FK) | `null` | → `auth.users(id)` |
| `avatar_url` | TEXT | `null` | URL del avatar del grupo |
| `max_miembros` | INTEGER | `null` | Límite de miembros |
| `activo` | BOOLEAN | `true` | Si el grupo está activo |
| `created_at` | TIMESTAMPTZ | `now()` | — |

### `miembros_grupo`
Relación N:N entre usuarios y grupos. Almacena XP y nivel **por grupo**.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID (PK) | auto | — |
| `grupo_id` | UUID (FK) | — | → `grupos(id)` |
| `usuario_id` | UUID (FK) | — | → `auth.users(id)` |
| `rol` | TEXT | `'miembro'` | `admin` o `miembro` |
| `xp` | INTEGER | `0` | XP acumulado en este grupo |
| `nivel` | INTEGER | `1` | Nivel calculado del XP del grupo |
| `unido_en` | TIMESTAMPTZ | `now()` | — |

### `invitaciones_grupo`
Invitaciones generadas para unirse a un grupo.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID (PK) | auto | — |
| `grupo_id` | UUID (FK) | — | → `grupos(id)` |
| `codigo` | TEXT | `null` | Código de invitación |
| `invitado_por` | UUID (FK) | `null` | → `auth.users(id)` |
| `estado` | TEXT | `'pendiente'` | `pendiente`, `usada`, `expirada` |
| `expira_en` | TIMESTAMPTZ | `null` | Fecha de expiración |
| `created_at` | TIMESTAMPTZ | `now()` | — |

---

### `planes_lectura`
Planes de lectura bíblica con fechas y estado.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | SERIAL (PK) | auto | — |
| `nombre_libro` | TEXT | — | Nombre del libro bíblico |
| `fecha_inicio` | DATE | — | Inicio del plan |
| `fecha_fin` | DATE | — | Fin del plan |
| `estado` | ENUM | `'inactivo'` | `inactivo`, `activo`, `proximo`, `completado` |
| `minutos_oracion_requeridos` | INTEGER | — | Minutos de oración requeridos por día |

---

### `capitulos_diarios`
Capítulos asignados por fecha dentro de un plan.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL (PK) | — |
| `plan_id` | INTEGER (FK) | → `planes_lectura(id)` |
| `referencia_capitulo` | TEXT | Ej: "Génesis 1" |
| `fecha_lectura` | DATE | Fecha asignada |

---

### `progreso_usuario`
Check-ins diarios de lectura y oración.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | SERIAL (PK) | auto | — |
| `usuario_id` | UUID (FK) | — | → `perfiles(id)` |
| `capitulo_id` | INTEGER (FK) | — | → `capitulos_diarios(id)` |
| `fecha_progreso` | DATE | today | Fecha del check-in |
| `lectura_completada` | BOOLEAN | `false` | ¿Leyó? |
| `lectura_completada_en` | TIMESTAMPTZ | `null` | Cuándo leyó |
| `oracion_completada` | BOOLEAN | `false` | ¿Oró? |
| `oracion_completada_en` | TIMESTAMPTZ | `null` | Cuándo oró |
| `segundos_oracion_acumulados` | INTEGER | `0` | Segundos de oración |
| `resumen_lectura` | TEXT | `null` | Resumen escrito por el usuario |

---

### `badges`
Catálogo de insignias desbloqueables.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | — |
| `nombre` | TEXT | Ej: "Primer Fuego" |
| `descripcion` | TEXT | Ej: "Primera racha de 7 días" |
| `icono` | TEXT | Emoji o código de ícono |
| `criterio` | JSONB | Ej: `{"type": "streak", "value": 7}` |
| `created_at` | TIMESTAMPTZ | — |

### `usuario_badges`
Badges desbloqueados por cada usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `usuario_id` | UUID (PK, FK) | → `perfiles(id)` |
| `badge_id` | UUID (PK, FK) | → `badges(id)` |
| `desbloqueado_en` | TIMESTAMPTZ | Cuándo se desbloqueó |

---

### `retos`
Retos personales y grupales.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID (PK) | auto | — |
| `creador_id` | UUID (FK) | — | → `perfiles(id)` |
| `tipo` | TEXT | — | `personal` o `grupal` |
| `titulo` | TEXT | — | Nombre del reto |
| `descripcion` | TEXT | `null` | Descripción opcional |
| `criterio` | JSONB | — | Ej: `{"action": "lectura", "count": 7}` |
| `recompensa_xp` | INTEGER | `null` | XP al completar |
| `penalizacion_monto` | NUMERIC | `null` | Penalización al fallar |
| `fecha_inicio` | DATE | today | — |
| `fecha_fin` | DATE | — | — |
| `completado` | BOOLEAN | `false` | — |
| `created_at` | TIMESTAMPTZ | `now()` | — |

### `reto_participantes`
Participación y progreso en retos.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | UUID (PK) | auto | — |
| `reto_id` | UUID (FK) | — | → `retos(id)` |
| `usuario_id` | UUID (FK) | — | → `perfiles(id)` |
| `progreso` | INTEGER | `0` | Progreso actual |
| `completado` | BOOLEAN | `false` | — |
| `completado_en` | TIMESTAMPTZ | `null` | Fecha de completado |
| `created_at` | TIMESTAMPTZ | `now()` | — |

---

### `penalizaciones`
Deudas por incumplimiento.

| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| `id` | SERIAL (PK) | auto | — |
| `usuario_id` | UUID (FK) | — | → `perfiles(id)` |
| `fecha_incumplimiento` | DATE | — | Fecha del incumplimiento |
| `monto` | NUMERIC | — | Monto de la penalización |
| `monto_pagado` | NUMERIC | `0` | Monto ya pagado |
| `estado` | ENUM | `'pendiente'` | `pendiente` o `pagada` |

### `canjeos`
Historial de canjes de XP por reducción de deuda.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | — |
| `usuario_id` | UUID (FK) | → `perfiles(id)` |
| `puntos_usados` | INTEGER | XP gastados |
| `monto_descontado` | NUMERIC | Monto descontado de la deuda |
| `descripcion` | TEXT | Descripción del canje |
| `created_at` | TIMESTAMPTZ | — |

### `recuperaciones_racha`
Registro de rachas recuperadas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID (PK) | — |
| `usuario_id` | UUID (FK) | → `perfiles(id)` |
| `metodo` | TEXT | `dinero`, `puntos`, `reto_extra` |
| `costo` | NUMERIC | Costo en dinero (si aplica) |
| `costo_puntos` | INTEGER | Costo en XP (si aplica) |
| `racha_recuperada` | INTEGER | Días de racha que se recuperó |
| `created_at` | TIMESTAMPTZ | — |

---

### `configuracion_app`
Configuración clave-valor para el sistema, ahora scoped por grupo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `clave` | TEXT (PK) | Nombre de la config |
| `valor` | TEXT | Valor de la config |
| `grupo_id` | UUID (PK, FK) | → `grupos(id)` — PK compuesta: `(clave, grupo_id)` |

**Claves actuales:**
| Clave | Valor Default | Descripción |
|-------|---------------|-------------|
| `timezone` | `America/Caracas` | Timezone IANA del grupo (ej: `Europe/Madrid`) |
| `monto_penalizacion` | `3` | Monto de penalización por incumplimiento |
| `modo_penalizacion` | `dinero` | `dinero` o `puntos` |
| `tasa_canjeo` | `100` | XP por $1 de descuento |
| `costo_recuperar_racha` | `200` | XP para recuperar racha |

---

### Tablas Sociales

| Tabla | PK | Descripción |
|-------|----|-------------|
| `actividad_comunidad` | `id` (serial) | Feed de actividad. `tipo_actividad`: `lectura_completada`, `oracion_completada`, `victoria`. Realtime habilitado (REPLICA IDENTITY FULL) |
| `comunidad_likes` | `id` (UUID) | Reacciones en actividades. Columna `tipo_reaccion` (like/prayer/fire/lightning). Unique constraint: `(actividad_id, user_id, tipo_reaccion)` |
| `comunidad_comentarios` | `id` (UUID) | Comentarios en actividades del feed |
| `suscripciones_push` | `id` (UUID) | Tokens de push notification (1:1 con usuario) |

---

## RPC Functions

| Función | Argumentos | Retorna | Descripción |
|---------|-----------|---------|-------------|
| `otorgar_xp` | `usuario_id`, `cantidad`, `motivo`, `referencia_id?`, `grupo_id?` | `{nuevo_xp, nuevo_nivel, subio_nivel}` | Otorga XP global + grupo (si `grupo_id`). Auto-levela ambos |
| `calcular_nivel` | `xp` | `INTEGER` | Calcula nivel según XP |
| `canjear_puntos` | `usuario_id`, `puntos`, `tasa`, `grupo_id?` | `{monto_descontado, xp_restante}` | Canjea XP → reducir deuda. Descuenta de grupo + global |
| `crear_plan_con_capitulos` | `nombre`, `fechas`, `capitulos` | void | Crea plan de lectura |
| `programar_plan_siguiente` | `plan_id` | void | Programa siguiente plan |
| `transicion_automatica_de_plan` | — | void | Transiciona planes activos |
| `registrar_penalizaciones_diarias` | — | void | Registra penalizaciones por grupo. Corre cada hora, solo procesa grupos donde es medianoche local. Advisory lock + orden aleatorio + micro-pausa |
| `nanoid` | `size` | TEXT | Genera ID corto para códigos de invitación |
| `aplicar_pago_a_usuario` | `usuario_id`, `monto` | void | Aplica pago a deudas |
| `get_all_user_streaks` | — | `[{user_id, streak_count}]` | Rachas de todos los usuarios |
| `get_all_push_subscriptions` | — | `[{usuario_id, subscription}]` | Todas las suscripciones push |
| `admin_crear_perfil` | `user_id`, `username`, `role` | JSON | Crea perfil (admin only) |
| `admin_actualizar_rol` | `user_id`, `role` | JSON | Actualiza rol (admin only) |

---

## Enums

```sql
CREATE TYPE plan_estado AS ENUM ('inactivo', 'activo', 'proximo', 'completado');
CREATE TYPE penalizacion_estado AS ENUM ('pendiente', 'pagada');
CREATE TYPE tipo_actividad AS ENUM ('lectura_completada', 'oracion_completada');
```
