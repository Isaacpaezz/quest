import { describe, expect, it } from 'vitest'
import { getGuidedIntercessionCapacity, selectGuidedIntercessionPetitions, type GuidedIntercessionPetition } from './guided-intercession'

const petition = (id: string, overrides: Partial<GuidedIntercessionPetition> = {}): GuidedIntercessionPetition => ({
  id,
  titulo: id,
  descripcion: null,
  categoria: 'otro',
  usuario_id: `author-${id}`,
  usuario_nombre: `Author ${id}`,
  oraciones_count: 0,
  creado_en: '2026-01-01T00:00:00.000Z',
  has_prayed: false,
  ...overrides,
})

const selectIds = (petitions: GuidedIntercessionPetition[], seconds = 60): string[] =>
  selectGuidedIntercessionPetitions({
    currentUserId: 'current-user',
    intercessionSeconds: seconds,
    petitions,
    referenceDate: '2026-01-03',
  }).map(item => item.id)

describe('getGuidedIntercessionCapacity', () => {
  it.each([
    [0, 0],
    [30, 0],
    [59, 0],
    [60, 1],
    [60 * 20, 6],
  ])('maps %s seconds to capacity %s', (seconds, expected) => {
    expect(getGuidedIntercessionCapacity(seconds)).toBe(expected)
  })
})

describe('selectGuidedIntercessionPetitions', () => {
  it('excludes own petitions and limits by duration capacity', () => {
    expect(selectIds([
      petition('own', { usuario_id: 'current-user' }),
      petition('one', { creado_en: '2026-01-03T00:00:00.000Z' }),
      petition('two', { creado_en: '2026-01-02T00:00:00.000Z' }),
      petition('three', { creado_en: '2026-01-01T00:00:00.000Z' }),
    ], 120)).toEqual(['one', 'two'])
  })

  it('does not select community petitions for sub-minute intercession sections', () => {
    expect(selectIds([
      petition('one'),
      petition('two'),
    ], 59)).toEqual([])
  })

  it.each([
    {
      name: 'recently prayed priority',
      petitions: [petition('recent', { last_prayed_at: '2026-01-02T10:00:00.000Z', categoria: 'urgente' }), petition('fresh')],
      expected: ['fresh'],
    },
    {
      name: 'urgency priority',
      petitions: [petition('regular', { categoria: 'familia' }), petition('urgent', { categoria: 'urgente' })],
      expected: ['urgent'],
    },
    {
      name: 'lower prayer count priority',
      petitions: [petition('many', { oraciones_count: 4 }), petition('few', { oraciones_count: 1 })],
      expected: ['few'],
    },
    {
      name: 'recency priority',
      petitions: [
        petition('older', { creado_en: '2026-01-01T00:00:00.000Z' }),
        petition('newer', { creado_en: '2026-01-02T00:00:00.000Z' }),
      ],
      expected: ['newer'],
    },
  ])('applies $name', ({ petitions, expected }) => {
    expect(selectIds(petitions)).toEqual(expected)
  })

  it('avoids duplicate requesters on the first pass when possible', () => {
    expect(selectIds([
      petition('same-newer', { usuario_id: 'author-1', creado_en: '2026-01-03T00:00:00.000Z' }),
      petition('same-older', { usuario_id: 'author-1', creado_en: '2026-01-02T00:00:00.000Z' }),
      petition('different', { usuario_id: 'author-2', creado_en: '2026-01-01T00:00:00.000Z' }),
    ], 120)).toEqual(['same-newer', 'different'])
  })

  it('includes recently prayed petitions when capacity exceeds fresh options', () => {
    expect(selectIds([
      petition('today', { last_prayed_at: '2026-01-03T10:00:00.000Z' }),
      petition('fresh', { creado_en: '2026-01-01T00:00:00.000Z' }),
      petition('yesterday', { last_prayed_at: '2026-01-02T10:00:00.000Z' }),
    ], 180)).toEqual(['fresh', 'yesterday', 'today'])
  })

  it('does not deprioritize lifetime-prayed petitions outside the recent window', () => {
    expect(selectIds([
      petition('older-prayed', { has_prayed: true, last_prayed_at: '2025-12-01T10:00:00.000Z', categoria: 'urgente' }),
      petition('fresh-regular', { categoria: 'otro' }),
    ])).toEqual(['older-prayed'])
  })
})
