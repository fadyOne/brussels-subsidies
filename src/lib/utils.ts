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

/**
 * Formate un nombre avec des espaces comme séparateurs de milliers
 * @param num - Le nombre à formater
 * @returns Le nombre formaté avec des espaces (ex: 1 234 567)
 */
export function formatNumberWithSpaces(num: number): string {
  return num.toLocaleString('fr-FR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })
}

/**
 * Development logging functions that only log in development mode
 */
const isDev = typeof process !== 'undefined' 
  ? process.env.NODE_ENV === 'development'
  : typeof window !== 'undefined' && (window as { __DEV__?: boolean }).__DEV__ !== false

export function devLog(...args: unknown[]): void {
  if (isDev) {
    console.log(...args)
  }
}

export function devWarn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args)
  }
}

export function devError(...args: unknown[]): void {
  if (isDev) {
    console.error(...args)
  }
}
