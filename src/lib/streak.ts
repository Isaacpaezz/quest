/**
 * Calculate streak count for a user based on their progress entries.
 * 
 * Rules:
 * - A day counts if lectura_completada AND oracion_completada are both true
 * - Dates must be actually consecutive (no gaps allowed)
 * - Free days (dias_libres) are skipped — they don't break the streak
 * - Starts counting from today backwards; if today isn't done, counts from yesterday
 * - The streak is preserved until midnight (if today isn't completed, yesterday's streak is shown)
 * 
 * @param progressEntries - Progress entries (any order, will be deduplicated by date)
 * @param todayStr - Today's date as 'YYYY-MM-DD'
 * @param diasLibres - Array of free day numbers (0=Sunday, 6=Saturday). Configured per group by admin.
 */
export function calculateStreak(
  progressEntries: Array<{
    fecha_progreso: string
    lectura_completada: boolean
    oracion_completada: boolean
  }>,
  todayStr?: string,
  diasLibres: number[] = []
): number {
  if (progressEntries.length === 0) return 0

  // Deduplicate by date and determine which dates are completed
  const completedDates = new Set<string>()
  for (const entry of progressEntries) {
    const date = entry.fecha_progreso.split('T')[0]
    if (entry.lectura_completada && entry.oracion_completada) {
      completedDates.add(date)
    }
  }

  if (completedDates.size === 0) return 0

  // Start from today and walk backwards
  const today = todayStr ? new Date(todayStr + 'T12:00:00') : new Date()
  let streak = 0
  let currentDate = new Date(today)

  // If today isn't completed yet, start from yesterday
  // (streak is preserved until midnight)
  const todayKey = formatDate(currentDate)
  if (!completedDates.has(todayKey)) {
    // If today is a free day, skip it first
    if (diasLibres.includes(currentDate.getDay())) {
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      // Today not completed — start from yesterday
      currentDate.setDate(currentDate.getDate() - 1)
    }
  }

  // Walk backwards through dates
  const maxLookback = 365 // Safety limit
  for (let i = 0; i < maxLookback; i++) {
    const dateKey = formatDate(currentDate)
    const dayOfWeek = currentDate.getDay()

    // Skip free days — they don't count and don't break streak
    if (diasLibres.includes(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() - 1)
      continue
    }

    if (completedDates.has(dateKey)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      // Gap found — streak broken
      break
    }
  }

  return streak
}

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
