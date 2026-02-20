-- ============================================================
-- Fix: Período de mantenimiento Feb 11-19, 2026
-- Grupo: Tiempo con Dios (21efefd8-f647-40d1-98cf-380069e6d7b4)
-- Plan: 19 (Jeremías)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. INSERT progreso faltante para Feb 11-18
--    Unique constraint is on (usuario_id, fecha_progreso)
-- ──────────────────────────────────────────────────────────────
INSERT INTO progreso_usuario (usuario_id, capitulo_id, fecha_progreso, lectura_completada, oracion_completada, segundos_oracion_acumulados)
SELECT m.usuario_id, c.id, c.fecha_lectura, true, true, 900
FROM miembros_grupo m
CROSS JOIN capitulos_diarios c
WHERE m.grupo_id = '21efefd8-f647-40d1-98cf-380069e6d7b4'
  AND c.plan_id = 19
  AND c.fecha_lectura >= '2026-02-11'
  AND c.fecha_lectura <= '2026-02-18'
ON CONFLICT (usuario_id, fecha_progreso) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 2. UPDATE progreso existente parcial para Feb 11-18
--    Marca como completado lo que estaba incompleto
-- ──────────────────────────────────────────────────────────────
UPDATE progreso_usuario pu
SET lectura_completada = true,
    oracion_completada = true,
    segundos_oracion_acumulados = GREATEST(pu.segundos_oracion_acumulados, 900)
FROM capitulos_diarios cd
WHERE pu.capitulo_id = cd.id
  AND cd.plan_id = 19
  AND cd.fecha_lectura >= '2026-02-11'
  AND cd.fecha_lectura <= '2026-02-18'
  AND pu.usuario_id IN (
    SELECT usuario_id FROM miembros_grupo
    WHERE grupo_id = '21efefd8-f647-40d1-98cf-380069e6d7b4'
  )
  AND (pu.lectura_completada = false OR pu.oracion_completada = false);

-- ──────────────────────────────────────────────────────────────
-- 3. DELETE progreso del 19 de febrero (quiebre de racha)
-- ──────────────────────────────────────────────────────────────
DELETE FROM progreso_usuario
WHERE capitulo_id = 406
  AND usuario_id IN (
    SELECT usuario_id FROM miembros_grupo
    WHERE grupo_id = '21efefd8-f647-40d1-98cf-380069e6d7b4'
  );

-- ──────────────────────────────────────────────────────────────
-- 4. DELETE penalizaciones del período de mantenimiento
-- ──────────────────────────────────────────────────────────────
DELETE FROM penalizaciones
WHERE grupo_id = '21efefd8-f647-40d1-98cf-380069e6d7b4'
  AND fecha_incumplimiento >= '2026-02-11'
  AND fecha_incumplimiento <= '2026-02-19'
  AND estado = 'pendiente';
