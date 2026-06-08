/**
 * Guided prayer section types, defaults, and duration calculation utilities.
 *
 * Section percentages are stored in `configuracion_app` with clave='oracion_secciones'
 * as a JSON string. When the config is missing or invalid, safe defaults are used.
 */

// ─── Section Keys ────────────────────────────────────────────────────────────

export const SECTION_KEYS = [
  'adoracion',
  'confesion',
  'gratitud',
  'suplica',
  'intercesion',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

// ─── Labels (display names for each section) ─────────────────────────────────

export const SECTION_LABELS: Record<SectionKey, string> = {
  adoracion: 'Adoración',
  confesion: 'Confesión',
  gratitud: 'Gratitud',
  suplica: 'Suplica personal',
  intercesion: 'Intercesión comunitaria',
}

// ─── Section Config (percentage per section, 0-100) ──────────────────────────

export type SectionConfig = Record<SectionKey, number>

/**
 * Safe default percentages that sum to exactly 100.
 * Used when no admin configuration exists or when parsing fails.
 */
export const DEFAULT_SECTIONS: SectionConfig = {
  adoracion: 20,
  confesion: 15,
  gratitud: 20,
  suplica: 25,
  intercesion: 20,
}

// ─── Section Duration (computed from total time + percentages) ────────────────

export type SectionDuration = {
  key: SectionKey
  label: string
  seconds: number
  /** Cumulative seconds from session start to the beginning of this section */
  startOffset: number
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Validate that a parsed object contains all required section keys
 * with non-negative number values that sum to exactly 100.
 */
export function validateSectionConfig(
  config: Record<string, unknown>
): { valid: true; config: SectionConfig } | { valid: false; error: string } {
  const result: SectionConfig = { ...DEFAULT_SECTIONS }
  let sum = 0

  for (const key of SECTION_KEYS) {
    const value = config[key]
    if (typeof value !== 'number' || value < 0) {
      return {
        valid: false,
        error: `Section "${key}" must be a non-negative number, got: ${String(value)}`,
      }
    }
    result[key] = value
    sum += value
  }

  if (sum !== 100) {
    return {
      valid: false,
      error: `Section percentages must sum to 100, got: ${sum}`,
    }
  }

  return { valid: true, config: result }
}

/**
 * Parse a raw JSON string (from `configuracion_app.valor`) into a SectionConfig.
 * Falls back to DEFAULT_SECTIONS when the input is missing, invalid, incomplete,
 * or when percentages do not sum to exactly 100.
 */
export function parseSectionConfig(raw: string | undefined): SectionConfig {
  if (!raw) return { ...DEFAULT_SECTIONS }

  try {
    const parsed = JSON.parse(raw)
    const result = validateSectionConfig(parsed)
    return result.valid ? result.config : { ...DEFAULT_SECTIONS }
  } catch {
    return { ...DEFAULT_SECTIONS }
  }
}

/**
 * Compute per-section durations from total prayer seconds and section percentages.
 *
 * Uses floor for each section; assigns any rounding remainder deterministically
 * to the last section so the sum always equals `totalSeconds`.
 */
export function computeSectionDurations(
  totalSeconds: number,
  config: SectionConfig
): SectionDuration[] {
  const entries = SECTION_KEYS.map((key) => ({
    key,
    seconds: Math.floor((totalSeconds * config[key]) / 100),
  }))

  // Assign rounding remainder to last section
  const assigned = entries.reduce((sum, e) => sum + e.seconds, 0)
  entries[entries.length - 1].seconds += totalSeconds - assigned

  // Compute cumulative start offsets
  let offset = 0
  return entries.map((e) => {
    const duration: SectionDuration = {
      key: e.key,
      label: SECTION_LABELS[e.key],
      seconds: e.seconds,
      startOffset: offset,
    }
    offset += e.seconds
    return duration
  })
}
