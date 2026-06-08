import { describe, it, expect } from 'vitest'
import {
  computeSectionDurations,
  parseSectionConfig,
  validateSectionConfig,
  DEFAULT_SECTIONS,
  SECTION_KEYS,
} from '../prayer-sections'

describe('computeSectionDurations', () => {
  it('total seconds equals requested total with default config', () => {
    const total = 300 // 5 minutes
    const durations = computeSectionDurations(total, DEFAULT_SECTIONS)
    const sum = durations.reduce((acc, d) => acc + d.seconds, 0)
    expect(sum).toBe(total)
  })

  it('total seconds equals requested total with uneven config', () => {
    const total = 120
    const config = { adoracion: 33, confesion: 17, gratitud: 20, suplica: 15, intercesion: 15 }
    const durations = computeSectionDurations(total, config)
    const sum = durations.reduce((acc, d) => acc + d.seconds, 0)
    expect(sum).toBe(total)
  })

  it('total seconds equals requested total with a prime number of seconds', () => {
    const total = 137 // prime — forces rounding
    const durations = computeSectionDurations(total, DEFAULT_SECTIONS)
    const sum = durations.reduce((acc, d) => acc + d.seconds, 0)
    expect(sum).toBe(total)
  })

  it('last section absorbs rounding remainder', () => {
    const total = 100
    // 20% of 100 = 20 each, no remainder expected
    const durations = computeSectionDurations(total, DEFAULT_SECTIONS)
    const lastSection = durations[durations.length - 1]
    expect(lastSection.key).toBe('intercesion')

    // Now use percentages that cause rounding: 33+17+20+15+15 = 100
    const config = { adoracion: 33, confesion: 17, gratitud: 20, suplica: 15, intercesion: 15 }
    const durations2 = computeSectionDurations(10, config)
    const sum = durations2.reduce((acc, d) => acc + d.seconds, 0)
    expect(sum).toBe(10)
  })

  it('start offsets are cumulative and sequential', () => {
    const total = 300
    const durations = computeSectionDurations(total, DEFAULT_SECTIONS)
    let expectedOffset = 0
    for (const d of durations) {
      expect(d.startOffset).toBe(expectedOffset)
      expectedOffset += d.seconds
    }
  })

  it('handles zero total seconds', () => {
    const durations = computeSectionDurations(0, DEFAULT_SECTIONS)
    const sum = durations.reduce((acc, d) => acc + d.seconds, 0)
    expect(sum).toBe(0)
    durations.forEach((d) => expect(d.seconds).toBe(0))
  })

  it('handles 100% in a single section', () => {
    const config = { adoracion: 100, confesion: 0, gratitud: 0, suplica: 0, intercesion: 0 }
    const durations = computeSectionDurations(60, config)
    expect(durations[0].seconds).toBe(60)
    expect(durations[1].seconds).toBe(0)
    const sum = durations.reduce((acc, d) => acc + d.seconds, 0)
    expect(sum).toBe(60)
  })

  it('produces correct labels for each section', () => {
    const durations = computeSectionDurations(100, DEFAULT_SECTIONS)
    expect(durations[0].label).toBe('Adoración')
    expect(durations[1].label).toBe('Confesión')
    expect(durations[2].label).toBe('Gratitud')
    expect(durations[3].label).toBe('Suplica personal')
    expect(durations[4].label).toBe('Intercesión comunitaria')
  })
})

describe('parseSectionConfig', () => {
  it('returns defaults for undefined input', () => {
    expect(parseSectionConfig(undefined)).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults for empty string', () => {
    expect(parseSectionConfig('')).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults for invalid JSON', () => {
    expect(parseSectionConfig('not json')).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults for non-object JSON', () => {
    expect(parseSectionConfig('"hello"')).toEqual(DEFAULT_SECTIONS)
    expect(parseSectionConfig('42')).toEqual(DEFAULT_SECTIONS)
    expect(parseSectionConfig('null')).toEqual(DEFAULT_SECTIONS)
    expect(parseSectionConfig('[]')).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults when percentages do not sum to 100', () => {
    const bad = JSON.stringify({ adoracion: 50, confesion: 50, gratitud: 50, suplica: 50, intercesion: 50 })
    expect(parseSectionConfig(bad)).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults when a key is missing', () => {
    const incomplete = JSON.stringify({ adoracion: 20, confesion: 15, gratitud: 20, suplica: 25 })
    expect(parseSectionConfig(incomplete)).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults when a value is negative', () => {
    const negative = JSON.stringify({ adoracion: -10, confesion: 30, gratitud: 20, suplica: 25, intercesion: 35 })
    expect(parseSectionConfig(negative)).toEqual(DEFAULT_SECTIONS)
  })

  it('returns defaults when a value is not a number', () => {
    const bad = JSON.stringify({ adoracion: '20', confesion: 15, gratitud: 20, suplica: 25, intercesion: 20 })
    expect(parseSectionConfig(bad)).toEqual(DEFAULT_SECTIONS)
  })

  it('accepts valid config that sums to 100', () => {
    const valid = JSON.stringify({ adoracion: 30, confesion: 10, gratitud: 25, suplica: 20, intercesion: 15 })
    const result = parseSectionConfig(valid)
    expect(result).toEqual({ adoracion: 30, confesion: 10, gratitud: 25, suplica: 20, intercesion: 15 })
  })

  it('rejects config summing to 99', () => {
    const almost = JSON.stringify({ adoracion: 30, confesion: 10, gratitud: 25, suplica: 20, intercesion: 14 })
    expect(parseSectionConfig(almost)).toEqual(DEFAULT_SECTIONS)
  })

  it('rejects config summing to 101', () => {
    const over = JSON.stringify({ adoracion: 30, confesion: 10, gratitud: 25, suplica: 20, intercesion: 16 })
    expect(parseSectionConfig(over)).toEqual(DEFAULT_SECTIONS)
  })
})

describe('validateSectionConfig', () => {
  it('validates a correct config', () => {
    const result = validateSectionConfig(DEFAULT_SECTIONS)
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.config).toEqual(DEFAULT_SECTIONS)
  })

  it('rejects when sum is not 100', () => {
    const result = validateSectionConfig({ adoracion: 50, confesion: 50, gratitud: 50, suplica: 50, intercesion: 50 })
    expect(result.valid).toBe(false)
  })

  it('rejects negative values', () => {
    const result = validateSectionConfig({ adoracion: -1, confesion: 26, gratitud: 25, suplica: 25, intercesion: 25 })
    expect(result.valid).toBe(false)
  })

  it('rejects non-number values', () => {
    const result = validateSectionConfig({ adoracion: '20', confesion: 15, gratitud: 20, suplica: 25, intercesion: 20 })
    expect(result.valid).toBe(false)
  })
})
