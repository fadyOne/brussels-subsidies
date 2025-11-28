/**
 * Category Configuration System
 * 
 * This module provides a flexible, configurable categorization system
 * that can be easily adapted for different data sources and categories.
 * 
 * Features:
 * - JSON-based configuration (easy to modify)
 * - Support for multiple category configs
 * - Priority-based matching
 * - Exclusion rules (to avoid false positives)
 * - Extensible for future data sources
 */

export interface CategoryRule {
  /** Keywords that trigger this category (case-insensitive) */
  keywords: string[]
  /** Keywords that exclude this category (to avoid false positives) */
  exclude?: string[]
  /** Priority: higher priority rules are checked first */
  priority?: number
}

export interface CategoryConfig {
  /** Category name */
  name: string
  /** Rules for matching this category */
  rules: CategoryRule[]
  /** Default category if no match is found */
  defaultCategory?: string
}

export interface CategoryMatcherConfig {
  /** Source identifier (e.g., 'brussels-subsidies', 'cpas', etc.) */
  source: string
  /** Categories configuration */
  categories: CategoryConfig[]
  /** Default category name */
  defaultCategory: string
}

/**
 * Default category configuration for Brussels Subsidies
 * This can be easily modified or replaced for different data sources
 */
export const DEFAULT_BRUSSELS_CATEGORIES: CategoryMatcherConfig = {
  source: 'brussels-subsidies',
  defaultCategory: 'Autre',
  categories: [
    {
      name: 'Sport',
      rules: [
        {
          keywords: ['sport', 'football', 'basketball', 'natation', 'judo', 'tennis', 'padel', 'course', 'athlétisme', 'cyclisme', 'rugby', 'volley', 'boxing', 'karate', 'taekwondo', 'hockey', 'pétanque', 'diving', 'synchro', 'futsal', 'gym'],
          exclude: ['transport', 'support', 'rapport'],
          priority: 10,
        },
      ],
    },
    {
      name: 'Musique & Festivals',
      rules: [
        {
          keywords: ['festival', 'musique', 'jazz', 'briff', 'bsff', 'lumières', 'midis', 'minimes', 'musicorum'],
          exclude: ['concertation', 'overlegcomité'],
          priority: 10,
        },
        {
          keywords: ['concert'],
          exclude: ['concertation', 'overlegcomité'],
          priority: 10,
        },
      ],
    },
    {
      name: 'Arts Visuels',
      rules: [
        {
          keywords: ['art', 'exposition', 'musée', 'woodblocks'],
          exclude: ['partie', 'participation', 'partenaire', 'particulier', 'particulièrement', 'particulière', 'quartier'],
          priority: 9,
        },
      ],
    },
    {
      name: 'Spectacle & Cinéma',
      rules: [
        {
          keywords: ['théâtre', 'spectacle', 'cinéma', 'film', 'cinémathèque'],
          priority: 8,
        },
      ],
    },
    {
      name: 'Littérature',
      rules: [
        {
          keywords: ['littérature', 'bibliothèque'],
          priority: 7,
        },
      ],
    },
    {
      name: 'Danse',
      rules: [
        {
          keywords: ['danse'],
          priority: 6,
        },
      ],
    },
    {
      name: 'Culture',
      rules: [
        {
          keywords: ['culture', 'ommegang'],
          exclude: ['agriculture'],
          priority: 5,
        },
      ],
    },
    {
      name: 'Social',
      rules: [
        {
          keywords: ['social', 'égalité', 'chances', 'handicap', 'seniors', 'jeunesse', 'famille', 'solidarité', 'insertion', 'prévention', 'aide', 'accompagnement', 'pride', 'lgbt', 'rainbow', 'droits', 'femmes', 'braderies', 'sécurité', 'oeuvres', 'sociaux', 'concertation', 'overlegcomité'],
          priority: 8,
        },
      ],
    },
    {
      name: 'Environnement',
      rules: [
        {
          keywords: ['environnement', 'climat', 'biodiversité', 'vert', 'nature', 'écologie', 'développement durable', 'énergie', 'recyclage', 'earth', 'hour', 'alimentation', 'durable', 'insectes', 'hôtels', 'vaisselle', 'réemployable', 'herbruikbaar'],
          priority: 7,
        },
      ],
    },
    {
      name: 'Éducation',
      rules: [
        {
          keywords: ['école', 'écoles', 'éducation', 'apprentissage', 'enseignement', 'pédagogie', 'étudiant', 'université', 'recherche', 'scientifique', 'devoirs', 'vormingen', 'vsd', 'opleiding', 'vélo', 'fietsevenementen', 'pairs', 'sexuelle'],
          exclude: ['information', 'transformation', 'réforme'],
          priority: 6,
        },
        {
          keywords: ['formation'],
          exclude: ['information', 'transformation', 'réforme'],
          priority: 6,
        },
      ],
    },
    {
      name: 'Santé',
      rules: [
        {
          keywords: ['santé', 'hôpital', 'médical', 'soins', 'bien-être', 'médecine', 'pharmacie', 'psychologie', 'mental', 'repos', 'verzorging', 'schuldenlast'],
          priority: 5,
        },
      ],
    },
    {
      name: 'Économie',
      rules: [
        {
          keywords: ['économie', 'emploi', 'entreprise', 'développement économique', 'innovation', 'startup', 'commerce', 'tourisme', 'made', 'versailles', 'congrès', 'mini-entreprises', 'promotion', 'toerisme'],
          priority: 4,
        },
      ],
    },
    {
      name: 'Quartier & Urbanisme',
      rules: [
        {
          keywords: ['quartier', 'contrat', 'urbanisme', 'logement', 'infrastructure', 'mobilité', 'rénovation', 'urbaine', 'balades', 'urbaines', 'littéraires', 'plaisirs', 'hiver', 'winterpret'],
          priority: 3,
        },
      ],
    },
    {
      name: 'Fonctionnement',
      rules: [
        {
          keywords: ['fonctionnement', 'werkingskosten', 'cotisation', 'bijdrage', 'membre', 'association', 'primes', 'syndicales', 'vakbondspremies', 'annuelle', 'jaarlijkse', 'lidmaatschapsbijdrage', 'revalorisation', 'herwaardering'],
          priority: 2,
        },
      ],
    },
  ],
}

/**
 * Category Matcher Engine
 * 
 * Matches text against category rules and returns the best match
 */
export class CategoryMatcher {
  private config: CategoryMatcherConfig

  constructor(config: CategoryMatcherConfig) {
    this.config = config
    // Sort categories by priority (highest first)
    this.config.categories.sort((a, b) => {
      const aPriority = Math.max(...a.rules.map(r => r.priority || 0))
      const bPriority = Math.max(...b.rules.map(r => r.priority || 0))
      return bPriority - aPriority
    })
  }

  /**
   * Match text against category rules
   * @param text - Text to categorize
   * @returns Category name or default category
   */
  categorize(text: string): string {
    if (!text || typeof text !== 'string') {
      return this.config.defaultCategory
    }

    const normalizedText = text.toLowerCase().trim()

    // Check each category in priority order
    for (const category of this.config.categories) {
      for (const rule of category.rules) {
        // Check if any keyword matches
        const hasKeyword = rule.keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))

        if (hasKeyword) {
          // Check exclusions
          if (rule.exclude) {
            const hasExclusion = rule.exclude.some(exclusion => normalizedText.includes(exclusion.toLowerCase()))
            if (hasExclusion) {
              continue // Skip this rule if exclusion matches
            }
          }

          // Match found!
          return category.name
        }
      }
    }

    // No match found, return default
    return this.config.defaultCategory
  }

  /**
   * Get all available category names
   */
  getCategories(): string[] {
    return this.config.categories.map(c => c.name)
  }

  /**
   * Get the configuration
   */
  getConfig(): CategoryMatcherConfig {
    return this.config
  }
}

/**
 * Default matcher instance for Brussels Subsidies
 */
let defaultMatcher: CategoryMatcher | null = null

/**
 * Get the default category matcher
 */
export function getDefaultCategoryMatcher(): CategoryMatcher {
  if (!defaultMatcher) {
    defaultMatcher = new CategoryMatcher(DEFAULT_BRUSSELS_CATEGORIES)
  }
  return defaultMatcher
}

/**
 * Create a custom category matcher from a configuration
 */
export function createCategoryMatcher(config: CategoryMatcherConfig): CategoryMatcher {
  return new CategoryMatcher(config)
}

/**
 * Load category configuration from a JSON file or object
 * This allows loading different configurations for different data sources
 */
export async function loadCategoryConfig(
  source: string | CategoryMatcherConfig
): Promise<CategoryMatcher> {
  if (typeof source === 'object') {
    return createCategoryMatcher(source)
  }

  // Try to load from a config file
  // For now, return default. In the future, we can load from:
  // - /config/categories/${source}.json
  // - Environment variable
  // - API endpoint
  // - etc.

  // For now, return default matcher
  return getDefaultCategoryMatcher()
}

/**
 * Convenience function for backward compatibility
 * Uses the default matcher
 */
export function categorizeSubside(objet: string): string {
  return getDefaultCategoryMatcher().categorize(objet)
}

