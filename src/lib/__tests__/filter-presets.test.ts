/**
 * Tests for Filter Presets System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createFilterPreset,
  loadFilterPreset,
  deleteFilterPreset,
  getAllPresets,
  clearAllPresets,
  type FilterPresetFilters,
} from '../filter-presets'

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
})()

describe('Filter Presets System', () => {
  beforeEach(() => {
    // Reset sessionStorage before each test
    mockSessionStorage.clear()
    
    // Mock global sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    })
    
    // Mock crypto.randomUUID if available
    if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
      Object.defineProperty(crypto, 'randomUUID', {
        value: () => 'test-uuid-12345',
        writable: true,
      })
    }
  })

  describe('createFilterPreset', () => {
    it('should create a preset with valid filters', () => {
      const filters: FilterPresetFilters = {
        search: 'Test Beneficiary',
        year: '2023',
      }
      
      const id = createFilterPreset(filters, 'beneficiary')
      
      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
    })

    it('should return null if no valid filters provided', () => {
      const filters: FilterPresetFilters = {}
      
      const id = createFilterPreset(filters)
      
      expect(id).toBeNull()
    })

    it('should return null if filters is null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = createFilterPreset(null as any)
      
      expect(id).toBeNull()
    })

    it('should handle very long search terms', () => {
      const longName = 'A'.repeat(1000)
      const filters: FilterPresetFilters = {
        search: longName,
      }
      
      const id = createFilterPreset(filters)
      
      expect(id).toBeTruthy()
      
      // Should be able to load it back
      const loaded = loadFilterPreset(id!)
      expect(loaded?.search).toBe(longName)
    })

    it('should create preset with category filter', () => {
      const filters: FilterPresetFilters = {
        category: 'Sport',
        year: 'all',
      }
      
      const id = createFilterPreset(filters, 'category')
      
      expect(id).toBeTruthy()
    })

    it('should create preset with combined filters', () => {
      const filters: FilterPresetFilters = {
        search: 'Test',
        category: 'Sport',
        year: '2023',
      }
      
      const id = createFilterPreset(filters, 'combined')
      
      expect(id).toBeTruthy()
    })
  })

  describe('loadFilterPreset', () => {
    it('should load a valid preset', () => {
      const filters: FilterPresetFilters = {
        search: 'Test Beneficiary',
        year: '2023',
      }
      
      const id = createFilterPreset(filters)
      expect(id).toBeTruthy()
      
      const loaded = loadFilterPreset(id!)
      
      expect(loaded).toBeTruthy()
      expect(loaded?.search).toBe('Test Beneficiary')
      expect(loaded?.year).toBe('2023')
    })

    it('should return null for non-existent preset', () => {
      const loaded = loadFilterPreset('non-existent-id')
      
      expect(loaded).toBeNull()
    })

    it('should return null for invalid ID', () => {
      const loaded = loadFilterPreset('')
      
      expect(loaded).toBeNull()
    })

    it('should handle corrupted preset data', () => {
      // Manually create corrupted data
      mockSessionStorage.setItem('brussels_sub_filter_filter_test', 'invalid json')
      
      const loaded = loadFilterPreset('test')
      
      expect(loaded).toBeNull()
    })
  })

  describe('deleteFilterPreset', () => {
    it('should delete an existing preset', () => {
      const filters: FilterPresetFilters = { search: 'Test' }
      const id = createFilterPreset(filters)
      
      expect(id).toBeTruthy()
      expect(loadFilterPreset(id!)).toBeTruthy()
      
      deleteFilterPreset(id!)
      
      expect(loadFilterPreset(id!)).toBeNull()
    })

    it('should handle deleting non-existent preset gracefully', () => {
      expect(() => deleteFilterPreset('non-existent')).not.toThrow()
    })
  })

  describe('getAllPresets', () => {
    it('should return all active presets', () => {
      createFilterPreset({ search: 'Test 1' })
      createFilterPreset({ search: 'Test 2' })
      createFilterPreset({ category: 'Sport' })
      
      const presets = getAllPresets()
      
      expect(presets.length).toBeGreaterThanOrEqual(3)
    })

    it('should not return expired presets', () => {
      // Create a preset and manually expire it
      const filters: FilterPresetFilters = { search: 'Test' }
      const id = createFilterPreset(filters)
      
      // Manually set expiration to past
      const stored = mockSessionStorage.getItem(`brussels_sub_filter_filter_${id}`)
      if (stored) {
        const preset = JSON.parse(stored)
        preset.expiresAt = Date.now() - 1000 // Expired
        mockSessionStorage.setItem(`brussels_sub_filter_filter_${id}`, JSON.stringify(preset))
      }
      
      const presets = getAllPresets()
      const found = presets.find(p => p.id === id)
      
      expect(found).toBeUndefined()
    })
  })

  describe('clearAllPresets', () => {
    it('should clear all presets', () => {
      createFilterPreset({ search: 'Test 1' })
      createFilterPreset({ search: 'Test 2' })
      
      expect(getAllPresets().length).toBeGreaterThanOrEqual(2)
      
      clearAllPresets()
      
      expect(getAllPresets().length).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle sessionStorage being unavailable', () => {
      // Mock sessionStorage to throw
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: () => { throw new Error('Storage unavailable') },
          setItem: () => { throw new Error('Storage unavailable') },
          removeItem: () => { throw new Error('Storage unavailable') },
          clear: () => { throw new Error('Storage unavailable') },
          length: 0,
          key: () => null,
        },
        writable: true,
      })
      
      const id = createFilterPreset({ search: 'Test' })
      
      // Should return null when storage unavailable
      expect(id).toBeNull()
    })

    it('should handle special characters in search', () => {
      const filters: FilterPresetFilters = {
        search: 'Test & Co. (Brussels) - "Special"',
      }
      
      const id = createFilterPreset(filters)
      expect(id).toBeTruthy()
      
      const loaded = loadFilterPreset(id!)
      expect(loaded?.search).toBe('Test & Co. (Brussels) - "Special"')
    })

    it('should handle empty strings vs undefined', () => {
      const filters1: FilterPresetFilters = {
        search: '',
        year: '2023',
      }
      
      // Empty string should be treated as no filter
      const id1 = createFilterPreset(filters1)
      expect(id1).toBeTruthy() // year filter is valid
      
      const loaded1 = loadFilterPreset(id1!)
      expect(loaded1?.search).toBe('')
      expect(loaded1?.year).toBe('2023')
    })
  })

  describe('Preset limit enforcement', () => {
    it('should enforce preset limit', () => {
      // Create many presets
      const ids: string[] = []
      for (let i = 0; i < 60; i++) {
        const id = createFilterPreset({ search: `Test ${i}` })
        if (id) ids.push(id)
      }
      
      // Should not exceed limit
      const presets = getAllPresets()
      expect(presets.length).toBeLessThanOrEqual(50)
    })
  })
})

