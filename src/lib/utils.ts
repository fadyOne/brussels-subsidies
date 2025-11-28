import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Tronque un nom pour l'affichage dans les légendes de graphiques
 * @param name - Le nom à tronquer
 * @param maxLength - Longueur maximale (défaut: 24)
 * @returns Le nom tronqué avec "..." si nécessaire
 */
export function truncateLegendName(name: string, maxLength: number = 24): string {
  if (!name || typeof name !== 'string') {
    return ''
  }
  if (name.length <= maxLength) {
    return name
  }
  return name.substring(0, maxLength) + '...'
}
