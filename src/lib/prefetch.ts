/**
 * Prefetch System - Préchargement intelligent des données et du code
 * 
 * Implémente la Solution 3 du plan de performance :
 * - Préchargement des données JSON en priorité basse
 * - Préchargement du chunk JavaScript
 * - Annulation automatique si l'utilisateur ne clique pas
 */

import { devLog, devWarn } from './utils'

// Budget de préchargement : limite le nombre de requêtes simultanées
const MAX_CONCURRENT_PREFETCHES = 3
let activePrefetches = 0
const prefetchQueue: Array<() => Promise<void>> = []

// Contrôleurs pour annuler les requêtes
const abortControllers = new Map<string, AbortController>()

/**
 * Précharge les données JSON pour une année donnée
 * Utilise une priorité basse pour ne pas bloquer les requêtes critiques
 */
export async function prefetchData(year: string): Promise<void> {
  const prefetchId = `data-${year}`
  
  // Annuler le préchargement précédent si existant
  const existingController = abortControllers.get(prefetchId)
  if (existingController) {
    existingController.abort()
  }
  
  const controller = new AbortController()
  abortControllers.set(prefetchId, controller)
  
  try {
    // Vérifier si déjà en cache (localStorage)
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = `brussels_subsidies_cache_v1.0.0`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          devLog(`[Prefetch] Données ${year} déjà en cache, skip`)
          return
        }
      } catch {
        // Ignorer les erreurs de localStorage
      }
    }
    
    // Précharger en priorité basse (si supporté)
    const fetchOptions: RequestInit & { priority?: 'low' | 'high' | 'auto' } = {
      signal: controller.signal,
      priority: 'low',
    }
    
    if (year === 'all') {
      // Précharger toutes les années
      const years = ['2024', '2023', '2022', '2021', '2020', '2019']
      const promises = years.map(async (y) => {
        try {
          // Essayer d'abord les fichiers validés
          let response = await fetch(`/data-${y}-validated.json`, fetchOptions)
          if (!response.ok) {
            response = await fetch(`/data-${y}.json`, fetchOptions)
          }
          if (response.ok) {
            // Ne pas parser, juste précharger dans le cache HTTP du navigateur
            await response.blob()
            devLog(`[Prefetch] Données ${y} préchargées`)
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            devLog(`[Prefetch] Préchargement ${y} annulé`)
          } else {
            devWarn(`[Prefetch] Erreur préchargement ${y}:`, error)
          }
        }
      })
      await Promise.allSettled(promises)
    } else {
      // Précharger une année spécifique
      try {
        let response = await fetch(`/data-${year}-validated.json`, fetchOptions)
        if (!response.ok) {
          response = await fetch(`/data-${year}.json`, fetchOptions)
        }
        if (response.ok) {
          await response.blob()
          devLog(`[Prefetch] Données ${year} préchargées`)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          devLog(`[Prefetch] Préchargement ${year} annulé`)
        } else {
          devWarn(`[Prefetch] Erreur préchargement ${year}:`, error)
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      devLog(`[Prefetch] Préchargement ${prefetchId} annulé`)
    } else {
      devWarn(`[Prefetch] Erreur:`, error)
    }
  } finally {
    abortControllers.delete(prefetchId)
  }
}

/**
 * Précharge le chunk JavaScript de la page analyse
 * Utilise le router Next.js pour précharger la route
 */
export function prefetchAnalysePage(): void {
  if (typeof window === 'undefined') return
  
  try {
    // Utiliser le router Next.js pour précharger
    // Next.js détecte automatiquement les liens avec prefetch
    // On peut aussi utiliser router.prefetch() mais nécessite d'être dans un composant
    // Pour l'instant, on précharge via un lien invisible
    
    // Créer un lien temporaire avec prefetch
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'document'
    link.href = '/analyse'
    document.head.appendChild(link)
    
    devLog('[Prefetch] Route /analyse préchargée')
    
    // Nettoyer après un délai
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    }, 1000)
  } catch (error) {
    devWarn('[Prefetch] Erreur préchargement route:', error)
  }
}

/**
 * Annule tous les préchargements actifs
 * Utile si l'utilisateur quitte la page ou ne clique pas
 */
export function cancelAllPrefetches(): void {
  abortControllers.forEach((controller) => {
    controller.abort()
  })
  abortControllers.clear()
  devLog('[Prefetch] Tous les préchargements annulés')
}

/**
 * Gère le préchargement intelligent avec budget et queue
 */
export async function smartPrefetch(
  prefetchFn: () => Promise<void>,
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  if (activePrefetches >= MAX_CONCURRENT_PREFETCHES) {
    // Ajouter à la queue
    prefetchQueue.push(prefetchFn)
    return
  }
  
  activePrefetches++
  
  try {
    await prefetchFn()
  } finally {
    activePrefetches--
    
    // Traiter la queue
    if (prefetchQueue.length > 0 && activePrefetches < MAX_CONCURRENT_PREFETCHES) {
      const next = prefetchQueue.shift()
      if (next) {
        smartPrefetch(next, priority)
      }
    }
  }
}

