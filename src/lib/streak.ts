import { DEFAULT_TIMEZONE } from '@/lib/utils'

/**
 * Calculate streak count for a user based on their progress entries.
 *
 * Rules:
 * - A day counts if lectura_completada AND oracion_completada are both true
 * - Dates must be actually consecutive (no gaps allowed)
 * - Free days (dias_libres) are skipped — they don't break the streak
 * - Excluded dates (no active plan) are skipped — they don't break the streak
 * - Starts counting from today backwards; if today isn't done, counts from yesterday
 * - The streak is preserved until midnight (if today isn't completed, yesterday's streak is shown)
 *
 * @param progressEntries - Progress entries (any order, will be deduplicated by date)
 * @param todayStr - Today's date as 'YYYY-MM-DD' (timezone-aware, computed via getToday(tz))
 * @param diasLibres - Array of free day numbers (0=Sunday, 6=Saturday). Configured per group by admin.
 * @param excludedDates - Array of specific dates ('YYYY-MM-DD') to skip (e.g., days without an active plan).
 * @param timezone - IANA timezone string for day-of-week calculations (e.g., 'America/Caracas').
 *                   Defaults to DEFAULT_TIMEZONE. Used only for dias_libres matching.
 */
export function calculateStreak(
  progressEntries: Array<{
    fecha_progreso: string
    lectura_completada: boolean
    oracion_completada: boolean
  }>,
  todayStr?: string,
  diasLibres: number[] = [],
  excludedDates: string[] = [],
  timezone: string = DEFAULT_TIMEZONE
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

  const excludedSet = new Set(excludedDates)

  // Start from today and walk backwards
  // Use UTC to avoid server timezone affecting date arithmetic
  const today = todayStr ? parseDateUTC(todayStr) : dateToUTC(new Date())
  let streak = 0
  let currentDate = new Date(today.getTime())

  // If today isn't completed yet, start from yesterday
  // (streak is preserved until midnight)
  const todayKey = formatDateUTC(currentDate)
  if (!completedDates.has(todayKey)) {
    // If today is a free day, skip it first
    if (diasLibres.includes(getDayOfWeekInTimezone(currentDate, timezone))) {
      currentDate.setUTCDate(currentDate.getUTCDate() - 1)
    } else {
      // Today not completed — start from yesterday
      currentDate.setUTCDate(currentDate.getUTCDate() - 1)
    }
  }

  // Walk backwards through dates
  const maxLookback = 365 // Safety limit
  for (let i = 0; i < maxLookback; i++) {
    const dateKey = formatDateUTC(currentDate)
    const dayOfWeek = getDayOfWeekInTimezone(currentDate, timezone)

    // Skip free days — they don't count and don't break streak
    if (diasLibres.includes(dayOfWeek)) {
      currentDate.setUTCDate(currentDate.getUTCDate() - 1)
      continue
    }

    // Skip excluded dates (days without active plan) — they don't count and don't break streak
    if (excludedSet.has(dateKey)) {
      currentDate.setUTCDate(currentDate.getUTCDate() - 1)
      continue
    }

    if (completedDates.has(dateKey)) {
      streak++
      currentDate.setUTCDate(currentDate.getUTCDate() - 1)
    } else {
      // Gap found — streak broken
      break
    }
  }

  return streak
}

/**
 * Get the day of the week (0=Sunday, 6=Saturday) for a Date in a specific timezone.
 * Uses Intl.DateTimeFormat for accurate timezone-aware day-of-week.
 */
export function getDayOfWeekInTimezone(date: Date, timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  })
  const weekday = formatter.format(date)
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return map[weekday] ?? 0
}

/**
 * Parse a 'YYYY-MM-DD' string into a UTC Date (noon UTC to avoid boundary issues).
 */
function parseDateUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

/**
 * Convert a local Date to a UTC date-only representation (noon UTC).
 */
function dateToUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0))
}

/**
 * Format a UTC Date as 'YYYY-MM-DD'.
 * Uses UTC methods to avoid server timezone affecting the output.
 */
function formatDateUTC(d: Date): string {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
