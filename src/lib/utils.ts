import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_TIMEZONE = 'America/Caracas'

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la timezone especificada.
 * @param timezone - IANA timezone string (ej: 'America/Caracas', 'Europe/Madrid')
 */
export function getToday(timezone: string = DEFAULT_TIMEZONE): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
}

/**
 * Convierte un Date a formato YYYY-MM-DD en la timezone especificada.
 * Útil para agrupar actividades por fecha en la timezone del grupo.
 */
export function formatDateInTimezone(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return date.toLocaleDateString('en-CA', { timeZone: timezone })
}

/** @deprecated Usar getToday(timezone) — se mantiene por compatibilidad */
export function getTodayInVenezuela(): string {
  return getToday(DEFAULT_TIMEZONE)
}
