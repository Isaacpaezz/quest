# Changelog — Quest

Todas las versiones y cambios notables del proyecto.

---

## [0.15.0] - 2026-02-19

### ✨ Nuevo
- **Panel de Admin completo** — 4 pantallas de administración bajo `/admin`
  - **Dashboard:** Grid de 4 stats (miembros, deuda, XP promedio, racha promedio), alertas inteligentes, acciones rápidas
  - **Miembros:** Lista con nombre/nivel/XP/racha/deuda, cambiar roles, eliminar miembros, código de invitación
  - **Configuración:** 9 parámetros (modo_penalizacion, monto, tasa_canjeo, timezone, dias_libres, métodos recuperación)
  - **Penalizaciones:** Ver deudas del grupo, aplicar pagos, crear penalización manual
  - **Planes:** Crear/eliminar planes de lectura, cola inteligente, omite días libres
- **Día libre configurable** — El admin elige qué días de la semana son libres (antes hardcodeado a domingo)
- **`getDiasLibres()` helper** en `grupo-helpers.ts` — Lee días libres del grupo desde `configuracion_app`
- **Utilidad compartida `calculateStreak()`** en `src/lib/streak.ts` — Acepta `diasLibres[]`, elimina lógica duplicada en 4 páginas
- **Historial: progreso comunitario** — Barras duales (individual + comunidad) por plan
- **Perfil: enlace admin simplificado** — Un solo enlace "Panel Admin"

### 🐛 Correcciones
- **Rachas corregidas** — Requieren lectura **Y** oración (antes bastaba con una)
- **Rachas por grupo** — Solo cuenta progreso de planes del grupo activo (antes era global)
- **Fechas consecutivas** — Verifica que los días sean realmente consecutivos
- **Racha vigente hasta medianoche** — Si hoy no has completado, muestra la racha de ayer
- **Penalizaciones por grupo** — Nueva columna `grupo_id` en tabla `penalizaciones` (antes sumaba deudas de todos los grupos)
- **Miembros "no hay miembros"** — Perfiles se buscan individualmente (join no funcionaba sin FK explícita)
- **Select se sobrepone** — Dropdown custom con z-index y click-outside (reemplaza `<Select>` shadcn)

### 🔧 Cambios
- Admin relocado de `src/app/(admin)/` a `src/app/(app)/admin/` (comparte layout principal)
- `community/page.tsx`: Reemplazó RPC global `get_all_user_streaks` por query scoped al grupo
- Layout: `pill-nav`, `desktop-sidebar`, `glass-header`, `menu-panel` actualizados con links a admin
- Migración: `20260220003400_add_grupo_id_to_penalizaciones.sql`
- Tipos de BD regenerados (`database.ts`)

---

## [0.14.0] - 2026-02-19

### ✨ Nuevo
- **XP por grupo** — El XP y nivel ahora son por grupo, con un acumulador global en `perfiles.xp`
- `miembros_grupo`: nuevas columnas `xp` (default 0) y `nivel` (default 1)
- `historial_xp`: nueva columna `grupo_id` para tracking por grupo
- Rankings (`/community`) usan XP del grupo activo
- Deudas y canjeos descuentan XP del grupo activo

### 🔧 Cambios
- `otorgar_xp()`: nuevo param `p_grupo_id` — actualiza XP global + grupo
- `canjear_puntos()`: nuevo param `p_grupo_id` — descuenta de grupo + global
- `grantXp()`: acepta `grupoId` opcional
- Todas las páginas (perfil, badges, retos, deudas, menu) leen XP de `miembros_grupo`
- `oracion/actions.ts`: refactorizado de update manual a `grantXp()`

---

## [0.13.0] - 2026-02-19

### ✨ Nuevo
- **Supabase Realtime en feed** — Nuevas actividades aparecen al instante sin recargar (hook `useRealtimeFeed`)
- **Reacciones múltiples** — ❤️ 🙏 🔥 ⚡ con picker (tap rápido = ❤️, long-press = picker completo)
- **Comentarios en feed** — Sección expandible con formulario, lista y eliminación (carga lazy)
- **Victorias auto-compartidas** — Al subir de nivel se publica automáticamente al feed con diseño dorado 🏆
- **Likes en tiempo real** — Contadores de likes y comentarios se sincronizan via Realtime UPDATE

### 🔧 Cambios
- `comunidad_likes`: nueva columna `tipo_reaccion` (like/prayer/fire/lightning) + constraint `unique_reaction_per_user`
- `actividad_comunidad`: habilitado Supabase Realtime + `REPLICA IDENTITY FULL`
- `tipo_actividad`: nuevo valor `victoria` para logros auto-compartidos
- `grantXp()`: auto-publica victoria al feed cuando `subio_nivel = true`
- `toggleLikeAction` → `toggleReactionAction` (backward compatible)

---

## [0.12.0] - 2026-02-19

### ✨ Nuevo
- **Timezone configurable por grupo** — Cada grupo define su propia zona horaria en `configuracion_app`
- `getToday(tz)` y `formatDateInTimezone(date, tz)` reemplazan a `getTodayInVenezuela()`
- `getTimezone(supabase)` lee la timezone del grupo activo

### 🔧 Cambios
- **PK `configuracion_app`**: `(clave)` → `(clave, grupo_id)` — soporta config independiente por grupo
- **Cron de penalizaciones**: ahora corre **cada hora** y solo procesa grupos donde es medianoche local
- Protecciones: advisory lock, orden aleatorio, micro-pausa entre grupos, `ON CONFLICT DO NOTHING`
- `getTodayInVenezuela()` marcada como deprecated (alias de `getToday()`)
- Removido import no usado en `history/page.tsx`

---

## [0.11.0] - 2026-02-19

### ✨ Nuevo
- **Sistema Multi-Grupo** — Crear, unirse y gestionar múltiples grupos desde `/grupos`
- **Selector de grupo** — Cambiar de grupo activo desde el menú móvil
- **Onboarding** — Flujo post-registro para crear o unirse a un grupo
- **Invitar miembros** — Botón "Invitar" con Web Share API nativa (WhatsApp, Telegram, AirDrop, etc.)
- **Scoping por grupo** — Comunidad, feed, retos y estadísticas filtrados por grupo activo
- **Nombre de grupo dinámico** — La página de comunidad muestra el nombre del grupo activo

### 🐛 Corregido
- **Clipboard crash** — `navigator.clipboard` no existe en HTTP/mobile; ahora usa fallback con textarea + `execCommand('copy')`

### 🔧 Cambios
- RPC `registrar_penalizaciones_diarias` ahora itera por grupo activo
- `configuracion_app` ahora soporta `grupo_id` para config por grupo
- `perfiles` incluye `grupo_activo_id` (FK → `grupos`)
- Tipos `Grupo`, `MiembroGrupo`, `InvitacionGrupo`, `GrupoConMiembros` en `definitions.ts`

---

## [0.10.0] - 2026-02-19

### ✨ Nuevo
- **Sistema XP completo** — Notificaciones animadas al ganar XP y subir de nivel
- **Historial XP** (`/perfil/xp`) — Página dedicada con desglose por día, motivo y hora
- **Nombres de nivel** — Semilla, Aprendiz, Peregrino, Explorador... hasta Apóstol
- **XP configurables** — Bonus por racha (+10), devocional completo (+15), oración 10min (+20)
- **Tarjetas XP clickeables** — En perfil y badges, enlazando al historial

### 🐛 Corregido
- Corregido nombre de columna `created_at` en consultas a `historial_xp`

### 🔧 Cambios
- Sección inline de historial XP removida del perfil (ahora en página dedicada)
- Documentación actualizada con sistema XP, niveles y historial

---

## [0.9.0] - 2026-02-19

### ✨ Nuevo
- **Retos personales y grupales** — Crear, invitar, seguir progreso
- **Detalle de reto** — Participantes, barra de progreso, deadline
- **Tarjetas de invitación ricas** — Fechas, creador, participantes, descripción
- **Negociación XP** — Propuesta de XP con trimmed mean para retos grupales
- **Badges** — 10 badges con grid visual (locked/unlocked) y XP bar
- **Deudas y Canjeo** — Balance, historial, canjeo de XP por reducción de deuda
- **Recuperar Racha** — Gastar XP para recuperar racha (solo visible cuando racha rota)
- **Comunidad** — Rankings por XP, racha actual, y racha máxima (all-time)

### 🔧 Cambios
- Ruta `/deudas` renombrada a `/debts` (consistencia en inglés para URLs)
- Ruta `/comunidad` renombrada a `/community`
- Botón "Recuperar Racha" ahora solo aparece si `currentStreak === 0 && maxStreak > 0`
- Menu panel rediseñado con drawer lateral, avatar, stats, y dark mode toggle
- Documentación actualizada: `skills/quest/SKILL.md` v2.0

---

## [0.8.0] - 2026-02-18

### ✨ Nuevo
- **Rediseño completo** de todas las pantallas (dark + light mode)
- **Design system** — Paleta oklch, tipografía Outfit + Inter
- **XP por actividades** — +50 XP por lectura, +50 XP por oración
- **Timer de oración** — Pantalla fullscreen con timer
- **Navegación móvil** — PillNav con tabs pill-shaped
- **Navegación desktop** — Sidebar con links
- **GlassHeader** — Header translúcido con título dinámico

---

## [0.7.0] - 2026-02

### ✨ Nuevo
- **Sistema de XP y niveles** — `perfiles.xp`, `perfiles.nivel`
- **RPC `otorgar_xp`** — Auto level-up al ganar XP
- **RPC `canjear_puntos`** — Canjeo de XP por reducción de deuda
- **Feed de actividad** — Lecturas y oraciones completadas
- **Likes y comentarios** en el feed

---

## [0.6.0] - 2026-01

### ✨ Nuevo
- **Planes de lectura** — Crear y seguir planes bíblicos
- **Progreso diario** — Check-in de lectura y oración
- **Penalizaciones** — Sistema de deudas por incumplimiento
- **Auth** — Login con email/password via Supabase
- **Historial** — Calendar view con días completados
