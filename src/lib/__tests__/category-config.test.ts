/**
 * Tests for the dynamic category configuration system
 */

import { describe, it, expect } from 'vitest'
import { 
  categorizeSubside, 
  getDefaultCategoryMatcher,
  createCategoryMatcher,
  type CategoryMatcherConfig 
} from '../category-config'

describe('Category Configuration System', () => {
  describe('categorizeSubside', () => {
    it('should categorize Sport correctly', () => {
      expect(categorizeSubside('Festival de football')).toBe('Sport')
      expect(categorizeSubside('Tournoi de tennis')).toBe('Sport')
      expect(categorizeSubside('Compétition de natation')).toBe('Sport')
    })

    it('should exclude false positives for Sport', () => {
      expect(categorizeSubside('Transport public')).toBe('Autre')
      expect(categorizeSubside('Support technique')).toBe('Autre')
      expect(categorizeSubside('Rapport annuel')).toBe('Autre')
    })

    it('should categorize Culture sub-categories correctly', () => {
      expect(categorizeSubside('Festival de musique')).toBe('Musique & Festivals')
      expect(categorizeSubside('Concert de jazz')).toBe('Musique & Festivals')
      expect(categorizeSubside('Exposition d\'art')).toBe('Arts Visuels')
      expect(categorizeSubside('Théâtre de rue')).toBe('Spectacle & Cinéma')
      expect(categorizeSubside('Bibliothèque publique')).toBe('Littérature')
      expect(categorizeSubside('Cours de danse')).toBe('Danse')
    })

    it('should exclude false positives for Culture', () => {
      expect(categorizeSubside('Concertation citoyenne')).toBe('Social')
      expect(categorizeSubside('Participation citoyenne')).toBe('Autre')
      expect(categorizeSubside('Agriculture durable')).toBe('Environnement')
    })

    it('should categorize Social correctly', () => {
      expect(categorizeSubside('Aide sociale')).toBe('Social')
      expect(categorizeSubside('Égalité des chances')).toBe('Social')
      expect(categorizeSubside('Insertion professionnelle')).toBe('Social')
      expect(categorizeSubside('Concertation sociale')).toBe('Social')
    })

    it('should categorize Environnement correctly', () => {
      expect(categorizeSubside('Protection de l\'environnement')).toBe('Environnement')
      expect(categorizeSubside('Biodiversité urbaine')).toBe('Environnement')
      expect(categorizeSubside('Énergie renouvelable')).toBe('Environnement')
    })

    it('should categorize Éducation correctly', () => {
      expect(categorizeSubside('Formation professionnelle')).toBe('Éducation')
      expect(categorizeSubside('École primaire')).toBe('Éducation')
      expect(categorizeSubside('Apprentissage continu')).toBe('Éducation')
    })

    it('should exclude false positives for Éducation', () => {
      expect(categorizeSubside('Information publique')).toBe('Autre')
      expect(categorizeSubside('Transformation digitale')).toBe('Autre')
      expect(categorizeSubside('Réforme administrative')).toBe('Autre')
    })

    it('should return default category for unknown text', () => {
      expect(categorizeSubside('')).toBe('Autre')
      expect(categorizeSubside('XYZ123')).toBe('Autre')
      expect(categorizeSubside('Projet innovant')).toBe('Autre')
    })

    it('should handle priority correctly (higher priority wins)', () => {
      // Musique & Festivals has higher priority than Culture
      expect(categorizeSubside('Festival culturel')).toBe('Musique & Festivals')
    })
  })

  describe('CategoryMatcher', () => {
    it('should create a custom matcher', () => {
      const customConfig: CategoryMatcherConfig = {
        source: 'test',
        defaultCategory: 'Other',
        categories: [
          {
            name: 'Test Category',
            rules: [
              {
                keywords: ['test', 'example'],
                priority: 10,
              },
            ],
          },
        ],
      }

      const matcher = createCategoryMatcher(customConfig)
      expect(matcher.categorize('This is a test')).toBe('Test Category')
      expect(matcher.categorize('Example project')).toBe('Test Category')
      expect(matcher.categorize('Unknown text')).toBe('Other')
    })

    it('should get all categories', () => {
      const matcher = getDefaultCategoryMatcher()
      const categories = matcher.getCategories()
      
      expect(categories).toContain('Sport')
      expect(categories).toContain('Culture')
      expect(categories).toContain('Social')
      expect(categories).toContain('Environnement')
      expect(categories.length).toBeGreaterThan(5)
    })

    it('should handle exclusion rules', () => {
      const customConfig: CategoryMatcherConfig = {
        source: 'test',
        defaultCategory: 'Other',
        categories: [
          {
            name: 'Test',
            rules: [
              {
                keywords: ['test'],
                exclude: ['testing'],
                priority: 10,
              },
            ],
          },
        ],
      }

      const matcher = createCategoryMatcher(customConfig)
      expect(matcher.categorize('This is a test')).toBe('Test')
      expect(matcher.categorize('This is testing')).toBe('Other') // Excluded
    })
  })

  describe('Edge cases', () => {
    it('should handle null/undefined input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(categorizeSubside(null as any)).toBe('Autre')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(categorizeSubside(undefined as any)).toBe('Autre')
    })

    it('should handle very long text', () => {
      const longText = 'Festival de musique '.repeat(100)
      expect(categorizeSubside(longText)).toBe('Musique & Festivals')
    })

    it('should handle special characters', () => {
      expect(categorizeSubside('Festival de musique & arts')).toBe('Musique & Festivals')
      expect(categorizeSubside('École primaire (renovation)')).toBe('Éducation')
    })

    it('should be case-insensitive', () => {
      expect(categorizeSubside('FESTIVAL DE MUSIQUE')).toBe('Musique & Festivals')
      expect(categorizeSubside('Festival De Musique')).toBe('Musique & Festivals')
      expect(categorizeSubside('festival de musique')).toBe('Musique & Festivals')
    })
  })
})

