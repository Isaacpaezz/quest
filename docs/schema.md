# Documentación del Esquema de Base de Datos

Esta referencia describe las tablas y relaciones principales en la base de datos de Quest (PostgreSQL en Supabase).

## Tablas Principales

### `perfiles`

Almacena la información pública de los usuarios.

- `id` (uuid, PK): Referencia a `auth.users`.
- `nombre_usuario` (text): Nombre visible en la comunidad.
- `rol` (text): Rol del usuario ('admin', 'usuario').
- `grupo_activo_id` (uuid, FK): Grupo activo del usuario → `grupos(id)`.
- `creado_en` (timestamptz): Fecha de registro.

### `planes_lectura`

Define los planes de lectura disponibles.

- `id` (int8, PK): Identificador único.
- `nombre` (text): Nombre del plan (ej. "Nuevo Testamento").
- `descripcion` (text): Descripción breve.
- `fecha_inicio` (date): Fecha de comienzo del plan.
- `fecha_fin` (date): Fecha de finalización calculada.
- `estado` (enum): 'activo', 'inactivo', 'completado'.

### `capitulos_diarios`

Detalla qué leer cada día para un plan específico.

- `id` (int8, PK): Identificador único.
- `plan_id` (int8, FK): Referencia a `planes_lectura`.
- `fecha` (date): Fecha asignada para la lectura.
- `referencia` (text): Pasaje bíblico (ej. "Mateo 1").

### `progreso_usuario`

Registra el cumplimiento diario de cada usuario.

- `id` (int8, PK): Identificador único.
- `usuario_id` (uuid, FK): Referencia a `perfiles`.
- `fecha_progreso` (date): Fecha del registro.
- `lectura_completada` (bool): Si completó la lectura.
- `oracion_completada` (bool): Si completó la oración.
- `resumen_lectura` (text): Reflexión opcional del usuario.

### `penalizaciones`

Registra las deudas por incumplimiento de tareas.

- `id` (int8, PK): Identificador único.
- `usuario_id` (uuid, FK): Referencia a `perfiles`.
- `fecha_incumplimiento` (date): Día que se falló.
- `monto` (numeric): Monto de la penalización.
- `monto_pagado` (numeric): Monto ya cancelado.
- `estado` (text): 'pendiente', 'pagado'.

### `actividad_comunidad`

Feed de eventos sociales. **Realtime habilitado** (REPLICA IDENTITY FULL).

- `id` (int8, PK): Identificador único.
- `usuario_id` (uuid, FK): Referencia a `perfiles`.
- `tipo_actividad` (enum): 'lectura_completada', 'oracion_completada', 'victoria'.
- `referencia_contenido` (text): Contexto (ej. "Mateo 5", "Nivel 3").
- `resumen_actividad` (text): Descripción de la actividad.
- `likes_count` (int): Contador de reacciones (actualizado por trigger).
- `comentarios_count` (int): Contador de comentarios.
- `creado_en` (timestamptz): Fecha del evento.

### `comunidad_likes`

Reacciones en actividades del feed.

- `id` (uuid, PK): Identificador único.
- `actividad_id` (int8, FK): Referencia a `actividad_comunidad`.
- `user_id` (uuid, FK): Referencia a `perfiles`.
- `tipo_reaccion` (text): 'like', 'prayer', 'fire', 'lightning'. Default: 'like'.
- Constraint: `unique_reaction_per_user (actividad_id, user_id, tipo_reaccion)`.

### `grupos`

Grupos de la aplicación.

- `id` (uuid, PK): Identificador único.
- `nombre` (text): Nombre del grupo.
- `codigo_invitacion` (text): Código para unirse (generado con `nanoid`).
- `creador_id` (uuid, FK): Creador del grupo.
- `activo` (boolean): Si el grupo está activo.
- `created_at` (timestamptz): Fecha de creación.

### `miembros_grupo`

Relación N:N entre usuarios y grupos. Almacena XP y nivel **por grupo**.

- `id` (uuid, PK): Identificador único.
- `grupo_id` (uuid, FK): Referencia a `grupos`.
- `usuario_id` (uuid, FK): Referencia a `perfiles`.
- `rol` (text): `admin` o `miembro`.
- `xp` (integer, default 0): XP acumulado en este grupo.
- `nivel` (integer, default 1): Nivel calculado del XP del grupo.
- `unido_en` (timestamptz): Fecha de unión.

### `configuracion_app`

Configuraciones del sistema, scoped por grupo.

- `clave` (text, PK): Nombre de la configuración (ej. 'monto_penalizacion').
- `valor` (text): Valor de la configuración.
- `grupo_id` (uuid, FK): Grupo al que aplica → `grupos(id)`.

### `historial_xp`

Registro detallado de cada ganancia de XP.

- `id` (uuid, PK): Identificador único.
- `usuario_id` (uuid, FK): Referencia a `perfiles`.
- `cantidad` (int): Cantidad de XP ganado.
- `motivo` (text): Tipo de actividad (lectura_completada, oracion_completada, racha_bonus, devocional_completo, oracion_bonus_10min, reto_personal_completado, reto_grupal_completado).
- `referencia_id` (text): ID opcional del recurso relacionado.
- `created_at` (timestamptz): Fecha y hora del evento.

**RLS:** Los usuarios solo pueden ver su propio historial (`usuario_id = auth.uid()`).

## Funciones Importantes (RPC)

- **`otorgar_xp(usuario_id, cantidad)`**: Otorga XP al usuario y auto-sube de nivel si corresponde. Inserta automáticamente un registro en `historial_xp`.
- **`registrar_penalizaciones_diarias()`**: Se ejecuta cada hora (cron `5 * * * *`). Para cada grupo activo donde es medianoche local (hora 0 en su timezone), lee `monto_penalizacion` y penaliza miembros que no cumplieron. Incluye advisory lock, orden aleatorio y micro-pausa entre grupos.
- **`get_all_user_streaks()`**: Calcula la racha actual de días consecutivos para todos los usuarios, permitiendo saltos de fin de semana (sábado a lunes).
- **`nanoid(size)`**: Genera IDs cortos para códigos de invitación de grupo.
- **`marcar_penalizacion_pagada(penalizacion_id)`**: Actualiza el estado de una penalización a 'pagado'.
- **`canjear_puntos(usuario_id, cantidad)`**: Canjea XP por reducción de deuda.

## Notas de Implementación

- **Zona Horaria:** Cada grupo tiene su propia timezone configurable en `configuracion_app` (clave `timezone`). Default: `America/Caracas`. Todas las funciones de fecha (`getToday`, `formatDateInTimezone`) y el cron de penalizaciones usan la timezone del grupo.
- **Domingos:** Los domingos se consideran días de descanso y están excluidos de la generación automática de penalizaciones.
