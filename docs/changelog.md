# Changelog — Quest

Todas las versiones y cambios notables del proyecto.

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
