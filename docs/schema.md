# Documentación del Esquema de Base de Datos

Esta referencia describe las tablas y relaciones principales en la base de datos de Quest (PostgreSQL en Supabase).

## Tablas Principales

### `perfiles`

Almacena la información pública de los usuarios.

- `id` (uuid, PK): Referencia a `auth.users`.
- `nombre_usuario` (text): Nombre visible en la comunidad.
- `rol` (text): Rol del usuario ('admin', 'usuario').
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

Feed de eventos sociales.

- `id` (int8, PK): Identificador único.
- `usuario_id` (uuid, FK): Referencia a `perfiles`.
- `tipo_actividad` (enum): 'lectura_completada', 'oracion_completada', etc.
- `referencia_contenido` (text): Contexto (ej. "Mateo 5").
- `creado_en` (timestamptz): Fecha del evento.

### `configuracion_app`

Configuraciones globales del sistema.

- `clave` (text, PK): Nombre de la configuración (ej. 'monto_penalizacion').
- `valor` (text): Valor de la configuración.

## Funciones Importantes (RPC)

- **`registrar_penalizaciones_diarias()`**: Se ejecuta diariamente (cron). Verifica el cumplimiento del día anterior (excluyendo domingos) y genera penalizaciones si es necesario.
- **`get_all_user_streaks()`**: Calcula la racha actual de días consecutivos para todos los usuarios, permitiendo saltos de fin de semana (sábado a lunes).
- **`marcar_penalizacion_pagada(penalizacion_id)`**: Actualiza el estado de una penalización a 'pagado'.

## Notas de Implementación

- **Zona Horaria:** Todas las funciones de fecha críticas utilizan la zona horaria 'America/Caracas' para asegurar la consistencia con los usuarios locales.
- **Domingos:** Los domingos se consideran días de descanso y están excluidos de la generación automática de penalizaciones.
