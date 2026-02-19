import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ─── XP Config Types ─────────────────────────────────────────────────────────
export interface XpConfig {
  lectura_completada: number
  oracion_completada: number
  oracion_bonus_10min: number
  racha_multiplicador: number
  racha_cap: number
  devocional_completo: number
  reto_personal: number
  reto_grupal_base: number
}

// Default solo config (used as fallback if DB read fails)
const DEFAULT_XP_CONFIG: XpConfig = {
  lectura_completada: 50,
  oracion_completada: 30,
  oracion_bonus_10min: 20,
  racha_multiplicador: 10,
  racha_cap: 100,
  devocional_completo: 25,
  reto_personal: 100,
  reto_grupal_base: 100,
}

// ─── Get XP Config ───────────────────────────────────────────────────────────
// For now uses 'solo' preset. When grupos (3F) are implemented,
// this will read the user's active group config.
export async function getXpConfig(
  supabase: SupabaseClient<Database>,
  _userId?: string // reserved for future grupo-aware config
): Promise<XpConfig> {
  try {
    const { data } = await supabase
      .from('xp_presets')
      .select('config')
      .eq('id', 'solo')
      .single()

    if (data?.config && typeof data.config === 'object') {
      return data.config as unknown as XpConfig
    }
  } catch {
    // fallback to default
  }
  return DEFAULT_XP_CONFIG
}

// ─── Grant XP ────────────────────────────────────────────────────────────────
export interface XpResult {
  nuevo_xp: number
  nuevo_nivel: number
  subio_nivel: boolean
}

export async function grantXp(
  supabase: SupabaseClient<Database>,
  userId: string,
  cantidad: number,
  motivo: string,
  referenciaId?: string,
  grupoId?: string
): Promise<XpResult | null> {
  if (cantidad <= 0) return null

  try {
    const { data, error } = await supabase.rpc('otorgar_xp', {
      p_usuario_id: userId,
      p_cantidad: cantidad,
      p_motivo: motivo,
      p_referencia_id: referenciaId,
      p_grupo_id: grupoId,
    })

    if (error) {
      console.error(`Error otorgando ${cantidad} XP (${motivo}):`, error)
      return null
    }

    const result = Array.isArray(data) ? data[0] : data
    const xpResult = result as XpResult

    // Auto-post victory to feed when user levels up
    if (xpResult?.subio_nivel) {
      try {
        await supabase.from('actividad_comunidad').insert({
          usuario_id: userId,
          tipo_actividad: 'victoria' as Database['public']['Enums']['tipo_actividad'],
          referencia_contenido: `Nivel ${xpResult.nuevo_nivel}`,
          resumen_actividad: `¡Ha alcanzado el nivel ${xpResult.nuevo_nivel}! 🎉`,
        })
      } catch (victoryErr) {
        // Don't fail the XP grant if victory post fails
        console.error('Error posting victory:', victoryErr)
      }
    }

    return xpResult
  } catch (err) {
    console.error(`Error otorgando ${cantidad} XP (${motivo}):`, err)
    return null
  }
}

// ─── Calculate Streak Bonus ──────────────────────────────────────────────────
export function calculateStreakBonus(streak: number, config: XpConfig): number {
  if (streak <= 0) return 0
  return Math.min(streak * config.racha_multiplicador, config.racha_cap)
}

// ─── XP Level Thresholds (same for solo and grupo) ───────────────────────────
export const XP_THRESHOLDS = [0, 100, 500, 1000, 1500, 2500, 3500, 5000, 7500, 10000]

export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 10) return 10000
  return XP_THRESHOLDS[currentLevel] ?? 10000
}

export function getXpProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  const currentThreshold = XP_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = getXpForNextLevel(level)
  const current = xp - currentThreshold
  const needed = nextThreshold - currentThreshold
  const percentage = needed > 0 ? Math.min((current / needed) * 100, 100) : 100
  return { current, needed, percentage }
}
