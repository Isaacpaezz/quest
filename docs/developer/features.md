# Features Implementadas — Quest

## Overview

Este documento describe todas las features implementadas en Quest hasta la fecha, con detalles técnicos de cada una.

---

## 1. Sustento Diario (Home)

**Ruta:** `/home`  
**Archivos clave:**
- `src/app/(app)/home/page.tsx` — Server component, fetch de datos
- `src/app/(app)/home/_components/sustento-card.tsx` — Card principal de lectura
- `src/app/(app)/home/_components/retos-home-section.tsx` — Sección de retos en home

### Funcionalidad
- Muestra la lectura bíblica del día (capítulo actual del plan activo)
- Botones de check-in: **Lectura ✅** y **Oración ✅**
- Al completar cada check-in → +50 XP via `otorgar_xp()` RPC
- **Notificaciones XP:** Toast animado al ganar XP, animación fullscreen al subir de nivel
- XP configurable en `src/lib/xp-helpers.ts`: bonus racha (+10), devocional completo (+15), oración 10min (+20)
- Muestra racha actual (días consecutivos)
- Progreso del plan (ej: "Semana 15 de 52")
- Mini-cards de retos con invitaciones pendientes

### Cálculo de Racha
```typescript
// Consultar últimos 60 registros ordenados por fecha desc
// Contar consecutivos donde lectura_completada OR oracion_completada
for (const prog of recentProgress) {
  if (prog.lectura_completada || prog.oracion_completada) {
    streakCount++
  } else { break }
}
```

---

## 2. Timer de Oración

**Ruta:** `/oracion`  
**Archivos clave:**
- `src/app/(app)/oracion/page.tsx`
- `src/app/(app)/oracion/_components/`

### Funcionalidad
- Timer con cuenta regresiva configurable
- Registra `segundos_oracion_acumulados` en `progreso_usuario`
- Marca `oracion_completada = true` al finalizar

---

## 3. Feed de Actividad

**Ruta:** `/feed`  
**Archivos clave:**
- `src/app/(app)/feed/page.tsx` — Server component, fetch de datos
- `src/app/(app)/feed/_components/feed-client.tsx` — Client component principal (ActivityItem, ReactionPicker)
- `src/app/(app)/feed/_components/use-realtime-feed.ts` — Hook de Supabase Realtime
- `src/app/(app)/feed/actions.ts` — Server actions (reacciones, comentarios)
- `src/app/(app)/feed/types.ts` — Tipos compartidos

### Funcionalidad
- Lista de actividades de la comunidad (lecturas, oraciones completadas, **victorias**)
- **Realtime:** nuevas actividades aparecen instantáneamente via Supabase Realtime (INSERT + UPDATE)
- **Reacciones múltiples:** ❤️ 🙏 🔥 ⚡ (tap rápido = ❤️, long-press = picker completo)
- **Comentarios:** sección expandible con form, lista y delete (carga lazy)
- **Victorias auto-compartidas:** al subir de nivel, se publica con diseño dorado 🏆
- Timestamps relativos ("hace 2h", "ayer")
- Optimistic UI para reacciones y comentarios

### Supabase Realtime
- Canal `feed-realtime` suscribe a `actividad_comunidad` (INSERT + UPDATE)
- INSERT: agrega nueva actividad al grupo correspondiente con fecha y perfil
- UPDATE: sincroniza `likes_count` y `comentarios_count` en tiempo real
- Requiere `REPLICA IDENTITY FULL` en la tabla

### Reacciones
- Tabla `comunidad_likes` con columna `tipo_reaccion` (like, prayer, fire, lightning)
- Constraint unique: `(actividad_id, user_id, tipo_reaccion)` — permite múltiples tipos por usuario
- Server action `toggleReactionAction` maneja add/remove por tipo

---

## 4. Comunidad (Rankings)

**Ruta:** `/community`  
**Archivos clave:**
- `src/app/(app)/community/page.tsx`
- `src/app/(app)/community/_components/`

### Funcionalidad
- Leaderboard por XP
- Rankings por racha (streak) actual y máxima (all-time)
- Avatar + nombre + nivel + XP de cada usuario
- Posición destacada del usuario actual

---

## 5. Historial

**Ruta:** `/history`  
**Archivos clave:**
- `src/app/(app)/history/page.tsx`

### Funcionalidad
- Calendar view con días completados marcados
- Estadísticas por período
- Detalle por día (lectura + oración)

---

## 6. Retos (Challenges)

**Ruta:** `/challenges` y `/challenges/[id]`  
**Archivos clave:**
- `src/app/(app)/challenges/page.tsx`
- `src/app/(app)/challenges/[id]/page.tsx`
- `src/app/(app)/challenges/_components/retos-client.tsx`
- `src/app/(app)/challenges/actions.ts`

### Funcionalidad

#### Lista de Retos
- Tabs: **Activos** | **Completados** | **Invitaciones**
- Crear reto personal o grupal
- Formulario: título, descripción, tipo, criterio, fechas, XP, penalización

#### Tarjetas de Invitación (ricas)
- 📅 Fechas (inicio → fin)
- 👤 Quién te invitó (creador)
- 👥 Número de participantes
- 📝 Descripción

#### Detalle de Reto
- Progreso porcentual con barra visual
- Lista de participantes con estado (completado/pendiente)
- Botón aceptar/rechazar invitación
- Deadline countdown

#### Negociación XP (Retos Grupales)
- Cada participante propone XP (`xp_propuesto`)
- Se calcula **trimmed mean** eliminando outliers
- El XP final se muestra en el detalle

---

## 7. Badges

**Ruta:** `/badges`  
**Archivos clave:**
- `src/app/(app)/badges/page.tsx`
- `src/app/(app)/badges/_components/badges-client.tsx`

### Funcionalidad
- Grid de 10 badges con estado (locked/unlocked)
- **Tarjeta XP clickeable** → enlaza a `/perfil/xp` ("Ver historial →")
- XP bar con nivel actual, nombre del nivel, y progreso al siguiente
- Efecto visual diferenciado para badges desbloqueados vs bloqueados

### Badges Disponibles
| Badge | Criterio |
|-------|----------|
| 🔥 Primer Fuego | Racha de 7 días |
| ⚡ Imparable | Racha de 30 días |
| 🏔️ Cima | Nivel 10 |
| 🙏 Guerrero de Oración | 100 oraciones |
| 📖 Devorador | 5 planes completados |
| 👥 Comunitario | 10 eventos |
| 💰 Libre de Deuda | Deuda pagada |
| 🏆 Retador | 50 retos completados |
| 🌅 Madrugador | 7 devocionales antes de 7am |
| ❤️ Fiel | 1 año en Quest |

---

## 8. Deudas y Canjeo

**Ruta:** `/debts`  
**Archivos clave:**
- `src/app/(app)/debts/page.tsx`
- `src/app/(app)/debts/_components/deudas-client.tsx`
- `src/app/(app)/debts/actions.ts`

### Funcionalidad
- Balance total de deuda pendiente
- Historial de penalizaciones
- **Canjear puntos:** XP → reducción de deuda (usa `canjear_puntos` RPC)
- **Recuperar Racha:** Botón solo visible cuando `currentStreak === 0 && maxStreak > 0`
  - Muestra racha anterior: "Recuperar Racha de X días (200 XP)"
  - Modal de confirmación → gasta XP via `recuperarRachaAction`

---

## 9. Perfil

**Ruta:** `/perfil`  
**Archivos clave:**
- `src/app/(app)/perfil/page.tsx`
- `src/app/(app)/perfil/_components/user-profile.tsx`

### Funcionalidad
- Avatar con iniciales
- Nombre de usuario y email
- Estadísticas: racha, lecturas, horas de oración
- **Tarjeta de nivel** con nombre ("Nivel 1 — Semilla"), barra de progreso, y enlace a historial XP
- Ajustes: tema, notificaciones, acerca de, soporte, cerrar sesión

---

## 10. Historial XP

**Ruta:** `/perfil/xp`  
**Archivos clave:**
- `src/app/(app)/perfil/xp/page.tsx` — Server component, fetch de datos
- `src/app/(app)/perfil/xp/_components/xp-history-client.tsx` — Client component

### Funcionalidad
- Tarjeta de resumen: nivel actual con nombre, XP total, barra de progreso con porcentaje
- Historial agrupado por día con fecha completa
- Cada entrada: emoji del motivo, nombre legible, hora exacta, y `+N XP`
- Total diario consolidado por grupo
- Datos vienen de tabla `historial_xp` (últimos 100 registros)
- Navegable desde perfil y badges (tarjeta XP clickeable)

### Niveles
| Nivel | Nombre |
|-------|--------|
| 1 | Semilla | 2 | Aprendiz | 3 | Peregrino |
| 4 | Explorador | 5 | Valiente | 6 | Guerrero |
| 7 | Campeón | 8 | Leyenda | 9 | Profeta | 10 | Apóstol |

---

## 11. Notificaciones XP

**Archivos clave:**
- `src/components/shared/xp-toast.tsx` — Componentes `XpGainToast` y `LevelUpNotification`
- `src/app/(app)/home/_components/dashboard-client.tsx` — State management

### Funcionalidad
- **XpGainToast:** Toast animado con `+N XP` al completar cualquier actividad
- **LevelUpNotification:** Overlay fullscreen con animación al subir de nivel
- Se dispara automáticamente vía callbacks `onXpGained` desde diálogos y timers

---

## 12. Layout y Navegación

### Mobile
- **PillNav:** Navegación inferior pill-shaped con 4 tabs (Home, Feed, Community, More)
- **GlassHeader:** Header translúcido con título dinámico por ruta
- **MenuPanel:** Drawer lateral con perfil, navegación completa, dark mode toggle, y **selector de grupo**

### Desktop
- **DesktopSidebar:** Sidebar izquierda con links a todas las secciones (incluye Grupos)
- Contenido centrado con max-width

---

## 13. Grupos (Multi-Grupo)

**Ruta:** `/grupos`  
**Archivos clave:**
- `src/app/(app)/grupos/page.tsx` — Server component
- `src/app/(app)/grupos/_components/grupos-client.tsx` — Client component
- `src/app/(app)/grupos/actions.ts` — Server actions (crear, unirse, cambiar grupo)
- `src/lib/grupo-helpers.ts` — Helpers server-side para scoping
- `src/components/layout/menu-panel.tsx` — Selector de grupo en menú móvil

### Funcionalidad

#### Gestión de Grupos
- Crear grupo → genera `codigo_invitacion` automático vía `nanoid(8)`
- Unirse a grupo → ingresar código de invitación
- Cambiar grupo activo → actualiza `perfiles.grupo_activo_id`
- Ver grupos del usuario con conteo de miembros y rol

#### Compartir / Invitar
- **Botón "Invitar"** → usa Web Share API nativa (`navigator.share`)
  - Soporta WhatsApp, Telegram, AirDrop, correo, etc.
  - Mensaje: `¡Únete a mi grupo "X" en Quest! 🙏\nUsa este código: ABC123`
- **Fallback desktop** → copia el mensaje completo al portapapeles
- **Botón "Copiar código"** → fallback con `textarea + execCommand('copy')` para HTTP/mobile

#### Scoping por Grupo
Todas las páginas principales filtran datos por miembros del grupo activo:
- `/community` → Rankings solo de miembros del grupo
- `/feed` → Actividades solo de miembros del grupo
- `/challenges` → Retos creados por miembros del grupo
- `/home` → Estadísticas (readers/prayers) del grupo

#### Selector de Grupo (Menú Móvil)
- Dropdown en header del `MenuPanel`
- Muestra grupo activo con icono y nombre
- Lista desplegable con todos los grupos del usuario
- Al seleccionar → `cambiarGrupoActivoAction` + `router.refresh()`

### Helper: `grupo-helpers.ts`
```typescript
getGrupoActivoId()       // → grupo_id del usuario actual
getMiembrosGrupo(id)     // → usuario_ids del grupo
getConfigGrupo(id)       // → configuración del grupo
getMiembrosGrupoActivo() // → { memberIds, grupoId, nombreGrupo }
getTimezone()            // → timezone IANA del grupo activo
```

---

## 14. Onboarding

**Ruta:** `/onboarding`  
**Archivos clave:**
- `src/app/(app)/onboarding/page.tsx` — Server component (redirect si ya tiene grupo)
- `src/app/(app)/onboarding/_components/onboarding-client.tsx` — Client component

### Funcionalidad
- Flujo post-registro para usuarios sin grupo activo
- Dos opciones: **Crear grupo** o **Unirse con código**
- Admins bypasan el redirect para poder revisar el diseño
- `auth-form.tsx` redirige a `/onboarding` después del registro

---

## 15. Timezone Configurable (Sub-fase 3G)

**Problema:** Todas las fechas estaban hardcodeadas a `America/Caracas`. Grupos en otras zonas horarias veían un corte de día incorrecto.

**Solución:** Cada grupo tiene su propia timezone en `configuracion_app`.

### Funciones de fecha
```typescript
// src/lib/utils.ts
getToday(timezone)              // → 'YYYY-MM-DD' en la timezone
formatDateInTimezone(date, tz)  // → convierte Date a 'YYYY-MM-DD'
DEFAULT_TIMEZONE                // → 'America/Caracas'
```

### Cron de penalizaciones
- Se ejecuta **cada hora** vía `pg_cron` (`5 * * * *`)
- Solo procesa grupos donde es **hora 0** (12:00–12:59 AM local)
- Protecciones: advisory lock, orden aleatorio, micro-pausa entre grupos
- `ON CONFLICT DO NOTHING` evita duplicados

### Archivos modificados
- `src/lib/utils.ts` — Funciones de fecha generalizadas
- `src/lib/grupo-helpers.ts` — `getTimezone()`
- `home/page.tsx`, `home/actions.ts`, `community/page.tsx`, `feed/page.tsx`, `oracion/page.tsx`, `oracion/actions.ts` — Usan timezone configurable
- `history/page.tsx` — Import no usado removido
- `supabase/migrations/20260219202700_*.sql` — PK fix + función + cron + seed
