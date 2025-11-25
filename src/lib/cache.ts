/**
 * Cache System - Gestion du cache localStorage pour les données de subsides
 * 
 * ⚠️ RISQUES IDENTIFIÉS ET MITIGATION :
 * 
 * 1. Données obsolètes :
 *    - Solution : Versioning du cache avec numéro de version
 *    - Invalidation automatique si version différente
 * 
 * 2. Quota localStorage dépassé :
 *    - Solution : Vérification de la taille avant stockage
 *    - Fallback gracieux si échec
 * 
 * 3. Erreurs de sérialisation :
 *    - Solution : Try/catch autour de toutes les opérations
 *    - Validation des données avant stockage
 * 
 * 4. localStorage non disponible :
 *    - Solution : Détection et fallback silencieux
 *    - L'application fonctionne normalement sans cache
 * 
 * 5. Conflits de version :
 *    - Solution : Numéro de version dans les clés de cache
 *    - Nettoyage automatique des anciennes versions
 */

import type { Subside } from './types'

// Version du cache - INCRÉMENTER si le format des données change
const CACHE_VERSION = '1.0.0'
const CACHE_PREFIX = 'brussels_subsidies_cache'
const CACHE_KEY = `${CACHE_PREFIX}_v${CACHE_VERSION}`
const CACHE_META_KEY = `${CACHE_PREFIX}_meta_v${CACHE_VERSION}`

// Durée de validité du cache (24 heures en millisecondes)
const CACHE_TTL = 24 * 60 * 60 * 1000

interface CacheMetadata {
  version: string
  timestamp: number
  year: string
  dataLength: number
}

/**
 * Vérifie si localStorage est disponible
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Nettoie les anciennes versions du cache
 */
function cleanupOldCacheVersions(): void {
  if (!isLocalStorageAvailable()) return

  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(CACHE_PREFIX) && key !== CACHE_KEY && key !== CACHE_META_KEY) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 Nettoyage: ${keysToRemove.length} anciennes versions de cache supprimées`)
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors du nettoyage du cache:', error)
  }
}

/**
 * Récupère les données depuis le cache
 * 
 * @param year - Année des données à récupérer ("all" pour toutes les années)
 * @returns Les données en cache ou null si non disponibles/expirées
 */
export function getCachedData(year: string): Subside[] | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    // Nettoyer les anciennes versions au premier accès
    cleanupOldCacheVersions()

    // Récupérer les métadonnées
    const metaJson = localStorage.getItem(CACHE_META_KEY)
    if (!metaJson) {
      return null
    }

    const meta: CacheMetadata = JSON.parse(metaJson)

    // Vérifier la version
    if (meta.version !== CACHE_VERSION) {
      console.log('🔄 Version du cache différente, invalidation...')
      clearCache()
      return null
    }

    // Vérifier l'année correspondante
    if (meta.year !== year) {
      return null
    }

    // Vérifier l'expiration
    const now = Date.now()
    if (now - meta.timestamp > CACHE_TTL) {
      console.log('⏰ Cache expiré, invalidation...')
      clearCache()
      return null
    }

    // Récupérer les données
    const dataJson = localStorage.getItem(CACHE_KEY)
    if (!dataJson) {
      return null
    }

    const data: Subside[] = JSON.parse(dataJson)

    // Vérifier la cohérence
    if (data.length !== meta.dataLength) {
      console.warn('⚠️ Incohérence détectée dans le cache, invalidation...')
      clearCache()
      return null
    }

    console.log(`✅ Cache hit: ${data.length} subsides récupérés depuis le cache`)
    return data
  } catch (error) {
    console.warn('⚠️ Erreur lors de la récupération du cache:', error)
    // En cas d'erreur, nettoyer le cache corrompu
    clearCache()
    return null
  }
}

/**
 * Stocke les données dans le cache
 * 
 * @param data - Les données à mettre en cache
 * @param year - Année des données ("all" pour toutes les années)
 * @returns true si le stockage a réussi, false sinon
 */
export function setCachedData(data: Subside[], year: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    // Vérifier la taille approximative (localStorage a une limite de ~5-10MB)
    const dataJson = JSON.stringify(data)
    const estimatedSize = new Blob([dataJson]).size

    // Limite de sécurité : 4MB (laisser de la marge)
    const MAX_SIZE = 4 * 1024 * 1024

    if (estimatedSize > MAX_SIZE) {
      console.warn(`⚠️ Données trop volumineuses pour le cache (${(estimatedSize / 1024 / 1024).toFixed(2)}MB), pas de mise en cache`)
      return false
    }

    // Stocker les métadonnées
    const meta: CacheMetadata = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      year,
      dataLength: data.length,
    }

    localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta))
    localStorage.setItem(CACHE_KEY, dataJson)

    console.log(`💾 Cache mis à jour: ${data.length} subsides stockés (${(estimatedSize / 1024).toFixed(2)}KB)`)
    return true
  } catch (error) {
    // Erreur probablement due au quota localStorage dépassé
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('⚠️ Quota localStorage dépassé, nettoyage et nouvelle tentative...')
      clearCache()
      
      // Nouvelle tentative après nettoyage
      try {
        const dataJson = JSON.stringify(data)
        const meta: CacheMetadata = {
          version: CACHE_VERSION,
          timestamp: Date.now(),
          year,
          dataLength: data.length,
        }
        localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta))
        localStorage.setItem(CACHE_KEY, dataJson)
        return true
      } catch (retryError) {
        console.warn('⚠️ Impossible de mettre en cache même après nettoyage:', retryError)
        return false
      }
    }

    console.warn('⚠️ Erreur lors de la mise en cache:', error)
    return false
  }
}

/**
 * Vide le cache
 */
export function clearCache(): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_META_KEY)
    console.log('🗑️ Cache vidé')
  } catch (error) {
    console.warn('⚠️ Erreur lors du vidage du cache:', error)
  }
}

/**
 * Vérifie si des données sont en cache pour une année donnée
 * 
 * @param year - Année à vérifier
 * @returns true si des données valides sont en cache
 */
export function hasCachedData(year: string): boolean {
  return getCachedData(year) !== null
}

