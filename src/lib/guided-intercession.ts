export const SECONDS_PER_INTERCESSION_PETITION = 60
export const MAX_GUIDED_INTERCESSION_PETITIONS = 6

export type GuidedIntercessionPetition = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  usuario_id: string
  usuario_nombre: string
  oraciones_count: number
  creado_en: string
  actualizado_en?: string | null
  has_prayed?: boolean
  last_prayed_at?: string | null
  oracion_guia?: string | null
}

type RecentPrayerWindow = 'today' | 'yesterday' | 'older-or-unprayed'

function dateOnly(value: string): string | null {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return null

  return new Date(timestamp).toISOString().slice(0, 10)
}

function getPreviousDate(date: string): string | null {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`)
  if (Number.isNaN(timestamp)) return null

  const previousDate = new Date(timestamp)
  previousDate.setUTCDate(previousDate.getUTCDate() - 1)
  return previousDate.toISOString().slice(0, 10)
}

function getRecentPrayerWindow(
  petition: GuidedIntercessionPetition,
  referenceDate?: string
): RecentPrayerWindow {
  if (!petition.last_prayed_at || !referenceDate) return 'older-or-unprayed'

  const prayedDate = dateOnly(petition.last_prayed_at)
  if (!prayedDate) return 'older-or-unprayed'

  if (prayedDate === referenceDate) return 'today'
  if (prayedDate === getPreviousDate(referenceDate)) return 'yesterday'

  return 'older-or-unprayed'
}

function recentPrayerWeight(window: RecentPrayerWindow): number {
  if (window === 'today') return 2
  if (window === 'yesterday') return 1
  return 0
}

export function getGuidedIntercessionCapacity(intercessionSeconds: number): number {
  if (!Number.isFinite(intercessionSeconds) || intercessionSeconds <= 0) return 0

  const capacity = Math.floor(intercessionSeconds / SECONDS_PER_INTERCESSION_PETITION)
  return Math.min(Math.max(capacity, 0), MAX_GUIDED_INTERCESSION_PETITIONS)
}

function isUrgent(petition: GuidedIntercessionPetition): boolean {
  return petition.categoria === 'urgente'
}

function comparePetitions(
  a: GuidedIntercessionPetition,
  b: GuidedIntercessionPetition,
  referenceDate?: string
): number {
  const recentPrayerDiff = recentPrayerWeight(getRecentPrayerWindow(a, referenceDate))
    - recentPrayerWeight(getRecentPrayerWindow(b, referenceDate))
  if (recentPrayerDiff !== 0) {
    return recentPrayerDiff
  }

  if (isUrgent(a) !== isUrgent(b)) {
    return isUrgent(a) ? -1 : 1
  }

  if (a.oraciones_count !== b.oraciones_count) {
    return a.oraciones_count - b.oraciones_count
  }

  const createdAtDiff = Date.parse(b.creado_en) - Date.parse(a.creado_en)
  if (createdAtDiff !== 0) return createdAtDiff

  return a.id.localeCompare(b.id)
}

export function selectGuidedIntercessionPetitions({
  petitions,
  currentUserId,
  intercessionSeconds,
  referenceDate,
}: {
  petitions: GuidedIntercessionPetition[]
  currentUserId: string
  intercessionSeconds: number
  referenceDate?: string
}): GuidedIntercessionPetition[] {
  const capacity = getGuidedIntercessionCapacity(intercessionSeconds)
  if (capacity === 0 || petitions.length === 0) return []

  const ordered = petitions
    .filter((petition) => petition.usuario_id !== currentUserId)
    .toSorted((a, b) => comparePetitions(a, b, referenceDate))

  const selected: GuidedIntercessionPetition[] = []
  const selectedRequesters = new Set<string>()

  for (const petition of ordered) {
    if (selected.length >= capacity) break
    if (selectedRequesters.has(petition.usuario_id)) continue

    selected.push(petition)
    selectedRequesters.add(petition.usuario_id)
  }

  if (selected.length < capacity) {
    const selectedIds = new Set(selected.map((petition) => petition.id))
    for (const petition of ordered) {
      if (selected.length >= capacity) break
      if (selectedIds.has(petition.id)) continue

      selected.push(petition)
      selectedIds.add(petition.id)
    }
  }

  return selected
}
