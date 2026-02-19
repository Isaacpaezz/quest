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
- `src/app/(app)/feed/page.tsx`
- `src/app/(app)/feed/_components/`

### Funcionalidad
- Lista de actividades de la comunidad (lecturas y oraciones completadas)
- Likes (❤️) y comentarios en cada actividad
- Timestamps relativos ("hace 2h", "ayer")

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

### Funcionalidad
- Grid de 10 badges con estado (locked/unlocked)
- XP bar con nivel actual y progreso al siguiente
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

### Funcionalidad
- Avatar con iniciales
- Nombre de usuario
- Nivel y XP
- Estadísticas personales

---

## 10. Layout y Navegación

### Mobile
- **PillNav:** Navegación inferior pill-shaped con 4 tabs (Home, Feed, Community, More)
- **GlassHeader:** Header translúcido con título dinámico por ruta
- **MenuPanel:** Drawer lateral con perfil, navegación completa, dark mode toggle

### Desktop
- **DesktopSidebar:** Sidebar izquierda con links a todas las secciones
- Contenido centrado con max-width
