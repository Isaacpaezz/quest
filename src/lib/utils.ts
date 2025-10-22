import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria de Venezuela (UTC-4)
 * Esto asegura que el día cambie a las 12:00am hora de Venezuela, no a las 8pm
 */
export function getTodayInVenezuela(): string {
  const now = new Date();
  // Convertir a zona horaria de Venezuela (UTC-4)
  const venezuelaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
  
  const year = venezuelaTime.getFullYear();
  const month = String(venezuelaTime.getMonth() + 1).padStart(2, '0');
  const day = String(venezuelaTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
