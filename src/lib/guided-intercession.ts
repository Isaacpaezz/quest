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
  oracion_guia?: string | null
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
  b: GuidedIntercessionPetition
): number {
  if (Boolean(a.has_prayed) !== Boolean(b.has_prayed)) {
    return a.has_prayed ? 1 : -1
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
}: {
  petitions: GuidedIntercessionPetition[]
  currentUserId: string
  intercessionSeconds: number
}): GuidedIntercessionPetition[] {
  const capacity = getGuidedIntercessionCapacity(intercessionSeconds)
  if (capacity === 0 || petitions.length === 0) return []

  const ordered = petitions
    .filter((petition) => petition.usuario_id !== currentUserId)
    .toSorted(comparePetitions)

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
