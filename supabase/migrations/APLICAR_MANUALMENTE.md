# Migraciones para Aplicar Manualmente

## Problema
Hay migraciones anteriores pendientes que causan conflictos al usar `supabase db push`.
Las nuevas migraciones (20251104) deben aplicarse manualmente via SQL Editor de Supabase.

## Migraciones a Aplicar

### 1. Corregir Zona Horaria de Transición de Planes
**Archivo:** `20251104233100_corregir_zona_horaria_transicion_planes.sql`

Copia y ejecuta el contenido de este archivo en el SQL Editor de Supabase.

### 2. Actualizar Horario del Cron Job
**Archivo:** `20251104233200_actualizar_horario_cron_transicion_planes.sql`

Copia y ejecuta el contenido de este archivo en el SQL Editor de Supabase.

## Pasos para Aplicar

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto: `quest` (yrmphoaxnmyqdmwluvro)
3. Ve a SQL Editor
4. Crea una nueva query
5. Copia el contenido de cada migración
6. Ejecuta en orden (primero 233100, luego 233200)

## Verificación

Después de aplicar, verifica que:
- La función `public.transicion_automatica_de_plan()` usa `America/Caracas`
- El cron job está programado para `'5 4 * * *'` (4:05 AM UTC = 12:05 AM VET)

## Bug Corregido

Este fix soluciona el problema donde los planes se marcaban como completados a las 8-9 PM
hora de Venezuela en lugar de después de medianoche.

**Antes:**
- Cron: 1:05 AM UTC = 9:05 PM Venezuela ❌
- Función: Usaba CURRENT_DATE (UTC) ❌

**Después:**
- Cron: 4:05 AM UTC = 12:05 AM Venezuela ✅
- Función: Usa zona horaria de Venezuela ✅
