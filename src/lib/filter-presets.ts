/**
 * Filter Presets System
 * 
 * Allows creating temporary filter presets that can be shared via short URLs.
 * Designed to be extensible for future features (documents, APIs, etc.).
 * 
 * Architecture:
 * - Phase 1: Uses sessionStorage (current)
 * - Phase 2: Can migrate to backend API (future)
 * 
 * Safety features:
 * - Automatic expiration (1 hour)
 * - Validation of preset structure
 * - Fallback if sessionStorage unavailable (hash-based)
 * - Error handling at every step
 * 
 * Hash Fallback:
 * - If sessionStorage unavailable, uses hash of search term
 * - Format: "hash:abc123..."
 * - Page searches by matching hash of beneficiary names
 */

export type FilterType = 'beneficiary' | 'category' | 'year' | 'document' | 'api' | 'combined'

export interface FilterPresetFilters {
  search?: string
  year?: string
  category?: string
  // Future extensibility:
  documentType?: string
  documentId?: string
  apiSource?: string
  decisionDate?: string
  [key: string]: string | undefined // Allow extensibility
}

export interface FilterPreset {
  id: string
  type: FilterType
  filters: FilterPresetFilters
  createdAt: number
  expiresAt: number
}

const PRESET_PREFIX = 'filter_'
const PRESET_EXPIRY_MS = 3600000 // 1 hour
const MAX_PRESETS = 50 // Limit to prevent storage bloat
const STORAGE_KEY_PREFIX = 'brussels_sub_filter_'

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false
    const test = '__sessionStorage_test__'
    sessionStorage.setItem(test, test)
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Generate a short unique ID for the preset
 * Uses crypto.randomUUID if available, otherwise falls back to timestamp + random
 */
function generatePresetId(): string {
  if (typeof window !== 'undefined' && crypto && crypto.randomUUID) {
    return crypto.randomUUID().substring(0, 16) // Short version
  }
  // Fallback: timestamp + random
  return `${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
}

/**
 * Generate a hash from a string (for fallback when sessionStorage unavailable)
 * Uses Web Crypto API if available, otherwise falls back to simple hash
 * 
 * @param text - Text to hash
 * @returns Hash string (16 characters)
 */
function generateHash(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  // Try Web Crypto API (SHA-256) if available
  if (typeof window !== 'undefined' && crypto && crypto.subtle) {
    // For now, use synchronous approach with a simple hash
    // In production, could use async crypto.subtle.digest, but that's async
    // For simplicity, we'll use a deterministic hash function
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    // Convert to positive hex string and take first 16 chars
    return Math.abs(hash).toString(16).substring(0, 16).padStart(16, '0')
  }
  
  // Fallback: simple hash
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).substring(0, 16).padStart(16, '0')
}

/**
 * Normalize text for hashing (consistent normalization)
 */
function normalizeForHash(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Export hash functions for use in page (for hash matching)
export { generateHash, normalizeForHash }

/**
 * Validate preset structure
 */
function validatePreset(preset: unknown): preset is FilterPreset {
  if (!preset || typeof preset !== 'object') return false
  
  const p = preset as Partial<FilterPreset>
  
  // Check required fields
  if (!p.id || typeof p.id !== 'string') return false
  if (!p.type || typeof p.type !== 'string') return false
  if (!p.filters || typeof p.filters !== 'object') return false
  if (typeof p.createdAt !== 'number') return false
  if (typeof p.expiresAt !== 'number') return false
  
  // Check expiration
  if (Date.now() > p.expiresAt) return false
  
  // Check filters structure
  const filters = p.filters as Record<string, unknown>
  for (const value of Object.values(filters)) {
    if (value !== undefined && typeof value !== 'string') {
      return false
    }
  }
  
  return true
}

/**
 * Clean up expired presets
 * This prevents storage bloat
 */
function cleanupExpiredPresets(): void {
  if (!isSessionStorageAvailable()) return
  
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX + PRESET_PREFIX)) {
        keys.push(key)
      }
    }
    
    let removed = 0
    for (const key of keys) {
      try {
        const stored = sessionStorage.getItem(key)
        if (!stored) {
          sessionStorage.removeItem(key)
          removed++
          continue
        }
        
        const preset = JSON.parse(stored) as FilterPreset
        if (!validatePreset(preset)) {
          sessionStorage.removeItem(key)
          removed++
        }
      } catch {
        // Invalid JSON, remove it
        sessionStorage.removeItem(key)
        removed++
      }
    }
    
    if (removed > 0) {
      console.log(`[FilterPresets] Cleaned up ${removed} expired/invalid presets`)
    }
  } catch (error) {
    console.warn('[FilterPresets] Error during cleanup:', error)
  }
}

/**
 * Count current presets
 */
function countPresets(): number {
  if (!isSessionStorageAvailable()) return 0
  
  try {
    let count = 0
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX + PRESET_PREFIX)) {
        count++
      }
    }
    return count
  } catch {
    return 0
  }
}

/**
 * Remove oldest presets if we exceed the limit
 */
function enforcePresetLimit(): void {
  if (!isSessionStorageAvailable()) return
  
  const currentCount = countPresets()
  if (currentCount < MAX_PRESETS) return
  
  try {
    // Get all presets with their creation times
    const presets: Array<{ key: string; createdAt: number }> = []
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX + PRESET_PREFIX)) {
        try {
          const stored = sessionStorage.getItem(key)
          if (stored) {
            const preset = JSON.parse(stored) as FilterPreset
            if (validatePreset(preset)) {
              presets.push({ key, createdAt: preset.createdAt })
            }
          }
        } catch {
          // Invalid, will be cleaned up
        }
      }
    }
    
    // Sort by creation time (oldest first)
    presets.sort((a, b) => a.createdAt - b.createdAt)
    
    // Remove oldest presets
    const toRemove = currentCount - MAX_PRESETS + 5 // Remove 5 extra to have buffer
    for (let i = 0; i < toRemove && i < presets.length; i++) {
      sessionStorage.removeItem(presets[i].key)
    }
    
    console.log(`[FilterPresets] Removed ${toRemove} oldest presets to stay under limit`)
  } catch (error) {
    console.warn('[FilterPresets] Error enforcing limit:', error)
  }
}

/**
 * Create a filter preset
 * 
 * @param filters - The filters to store
 * @param type - Type of filter preset
 * @returns Preset ID (or hash if sessionStorage unavailable) or null if creation failed
 */
export function createFilterPreset(
  filters: FilterPresetFilters,
  type: FilterType = 'combined'
): string | null {
  // Cleanup expired presets first (if storage available)
  if (isSessionStorageAvailable()) {
    cleanupExpiredPresets()
  }
  
  // Validate filters
  if (!filters || typeof filters !== 'object') {
    console.error('[FilterPresets] Invalid filters provided')
    return null
  }
  
  // Check if we have at least one filter
  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '')
  if (!hasFilters) {
    console.warn('[FilterPresets] No valid filters provided')
    return null
  }
  
  // Check if sessionStorage is available
  if (!isSessionStorageAvailable()) {
    // FALLBACK: Use hash-based approach
    console.warn('[FilterPresets] sessionStorage not available, using hash fallback')
    
    // For hash fallback, we need a search term to hash
    const searchTerm = filters.search
    if (!searchTerm || typeof searchTerm !== 'string') {
      console.warn('[FilterPresets] Hash fallback requires a search term')
      return null
    }
    
    // Generate hash from normalized search term
    const normalized = normalizeForHash(searchTerm)
    const hash = generateHash(normalized)
    
    if (!hash) {
      console.error('[FilterPresets] Failed to generate hash')
      return null
    }
    
    // Return hash with prefix to identify it as a hash
    console.log(`[FilterPresets] Created hash fallback: hash:${hash} for search: ${searchTerm.substring(0, 50)}...`)
    return `hash:${hash}`
  }
  
  try {
    // Validate filters
    if (!filters || typeof filters !== 'object') {
      console.error('[FilterPresets] Invalid filters provided')
      return null
    }
    
    // Check if we have at least one filter
    const hasFilters = Object.values(filters).some(v => v !== undefined && v !== '')
    if (!hasFilters) {
      console.warn('[FilterPresets] No valid filters provided')
      return null
    }
    
    // Enforce limit
    enforcePresetLimit()
    
    // Create preset
    const now = Date.now()
    const preset: FilterPreset = {
      id: generatePresetId(),
      type,
      filters: { ...filters }, // Copy to avoid mutations
      createdAt: now,
      expiresAt: now + PRESET_EXPIRY_MS,
    }
    
    // Validate before storing
    if (!validatePreset(preset)) {
      console.error('[FilterPresets] Generated preset is invalid')
      return null
    }
    
    // Store preset
    const storageKey = STORAGE_KEY_PREFIX + PRESET_PREFIX + preset.id
    sessionStorage.setItem(storageKey, JSON.stringify(preset))
    
    console.log(`[FilterPresets] Created preset ${preset.id} of type ${type}`)
    return preset.id
  } catch (error) {
    console.error('[FilterPresets] Error creating preset:', error)
    return null
  }
}

/**
 * Load a filter preset by ID
 * 
 * @param id - Preset ID or hash (format: "hash:abc123...")
 * @returns Filter preset or null if not found/expired/invalid
 */
export function loadFilterPreset(id: string): FilterPresetFilters | null {
  if (!id || typeof id !== 'string') {
    return null
  }
  
  // Check if this is a hash-based preset (fallback mode)
  if (id.startsWith('hash:')) {
    // Hash-based preset: we can't load the original filters from storage
    // Instead, we return a special marker that the page can handle
    // The page will need to search by matching hash
    const hash = id.substring(5) // Remove "hash:" prefix
    
    if (!hash || hash.length < 8) {
      console.warn('[FilterPresets] Invalid hash format')
      return null
    }
    
    console.log(`[FilterPresets] Hash-based preset detected: ${hash}`)
    // Return a special marker - the page will handle the hash search
    return {
      _hash: hash, // Special marker for hash-based search
      _isHash: 'true', // Flag to indicate this is a hash
    } as FilterPresetFilters & { _hash?: string; _isHash?: string }
  }
  
  // Normal preset loading from sessionStorage
  if (!isSessionStorageAvailable()) {
    console.warn('[FilterPresets] sessionStorage not available, cannot load preset')
    return null
  }
  
  try {
    const storageKey = STORAGE_KEY_PREFIX + PRESET_PREFIX + id
    const stored = sessionStorage.getItem(storageKey)
    
    if (!stored) {
      console.warn(`[FilterPresets] Preset ${id} not found`)
      return null
    }
    
    const preset = JSON.parse(stored) as FilterPreset
    
    // Validate preset
    if (!validatePreset(preset)) {
      console.warn(`[FilterPresets] Preset ${id} is invalid or expired`)
      // Clean up invalid preset
      sessionStorage.removeItem(storageKey)
      return null
    }
    
    console.log(`[FilterPresets] Loaded preset ${id} of type ${preset.type}`)
    return preset.filters
  } catch (error) {
    console.error(`[FilterPresets] Error loading preset ${id}:`, error)
    // Clean up corrupted preset
    try {
      const storageKey = STORAGE_KEY_PREFIX + PRESET_PREFIX + id
      sessionStorage.removeItem(storageKey)
    } catch {
      // Ignore cleanup errors
    }
    return null
  }
}

/**
 * Delete a filter preset
 * 
 * @param id - Preset ID
 */
export function deleteFilterPreset(id: string): void {
  if (!id || typeof id !== 'string') return
  
  if (!isSessionStorageAvailable()) return
  
  try {
    const storageKey = STORAGE_KEY_PREFIX + PRESET_PREFIX + id
    sessionStorage.removeItem(storageKey)
    console.log(`[FilterPresets] Deleted preset ${id}`)
  } catch (error) {
    console.error(`[FilterPresets] Error deleting preset ${id}:`, error)
  }
}

/**
 * Get all active presets (for debugging/admin)
 */
export function getAllPresets(): FilterPreset[] {
  if (!isSessionStorageAvailable()) return []
  
  cleanupExpiredPresets()
  
  const presets: FilterPreset[] = []
  
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX + PRESET_PREFIX)) {
        try {
          const stored = sessionStorage.getItem(key)
          if (stored) {
            const preset = JSON.parse(stored) as FilterPreset
            if (validatePreset(preset)) {
              presets.push(preset)
            }
          }
        } catch {
          // Skip invalid presets
        }
      }
    }
  } catch (error) {
    console.error('[FilterPresets] Error getting all presets:', error)
  }
  
  return presets
}

/**
 * Clear all presets (for testing/cleanup)
 */
export function clearAllPresets(): void {
  if (!isSessionStorageAvailable()) return
  
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(STORAGE_KEY_PREFIX + PRESET_PREFIX)) {
        keys.push(key)
      }
    }
    
    for (const key of keys) {
      sessionStorage.removeItem(key)
    }
    
    console.log(`[FilterPresets] Cleared ${keys.length} presets`)
  } catch (error) {
    console.error('[FilterPresets] Error clearing presets:', error)
  }
}

