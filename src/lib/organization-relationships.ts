/**
 * Organization Relationships - Détection de relations entre organisations
 * 
 * Ce module détecte les relations entre organisations basées sur les mentions
 * explicites dans les objets de subsides (Solution 1 : Approche Conservatrice).
 * 
 * Approche :
 * 1. Index inversé : Map chaque nom d'organisation normalisé → objets qui le mentionnent
 * 2. Détection : Pour chaque organisation, cherche les mentions d'autres organisations
 * 3. Score de confiance : Basé sur fréquence, contexte, cohérence temporelle
 * 4. Seuil strict : Seules les relations avec score > 0.75 sont retournées
 */

import type { Subside } from './types'

/**
 * Interface pour une relation détectée entre deux organisations
 */
export interface OrganizationRelationship {
  /** Nom de l'organisation source (celle qui mentionne) */
  sourceOrg: string
  /** Nom de l'organisation cible (celle qui est mentionnée) */
  targetOrg: string
  /** Score de confiance (0-1) */
  confidence: number
  /** Nombre de mentions trouvées */
  mentionCount: number
  /** Années où la relation apparaît */
  years: string[]
  /** Exemples de contextes (objets de subsides) */
  contexts: Array<{
    objet: string
    annee: string
    montant: number
  }>
}

/**
 * Normalise un nom pour la détection de mentions (moins agressive que pour le regroupement)
 * 
 * Pour la détection, on veut être plus permissif pour capturer les variations
 * tout en évitant les faux positifs avec des mots communs.
 * 
 * @param name - Nom original
 * @returns Nom normalisé pour la recherche
 */
function normalizeForDetection(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  let normalized = name.trim()
  
  // 1. Convertir en minuscules
  normalized = normalized.toLowerCase()
  
  // 2. Normaliser Unicode (NFD) et supprimer les accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // 3. Remplacer les points, tirets, slashes par des espaces
  normalized = normalized.replace(/[.\-\/|_]/g, ' ')
  
  // 4. Supprimer les caractères non-alphanumériques (sauf espaces)
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ')
  
  // 5. Supprimer les suffixes légaux (mais garder plus de contexte que pour le regroupement)
  const legalSuffixes = ['asbl', 'vzw', 'scrl', 'sprl', 'sa', 'nv', 'bv', 'cv', 'sc', 'srl', 'bvba', 'cvba']
  legalSuffixes.forEach(suffix => {
    const suffixRegex = new RegExp(`\\s+${suffix}\\s*$`, 'i')
    normalized = normalized.replace(suffixRegex, '')
  })
  
  // 6. Normaliser les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Vérifie si un objet de subside mentionne une organisation
 * 
 * Utilise plusieurs stratégies pour détecter les mentions :
 * 1. Recherche exacte du nom normalisé
 * 2. Recherche avec guillemets (ex: "Hangar Maritime")
 * 3. Recherche dans un contexte relationnel (pour, avec, organisé par, etc.)
 * 
 * @param objet - Objet du subside à analyser
 * @param targetNormalized - Nom de l'organisation cible normalisé
 * @param targetOriginal - Nom de l'organisation cible original (pour recherche exacte)
 * @returns true si une mention est détectée
 */
function detectMention(
  objet: string,
  targetNormalized: string,
  targetOriginal: string
): boolean {
  if (!objet || !targetNormalized) {
    return false
  }
  
  const objetLower = objet.toLowerCase()
  const targetLower = targetOriginal.toLowerCase()
  
  // 1. Recherche exacte du nom original (case-insensitive)
  if (objetLower.includes(targetLower)) {
    // Vérifier que ce n'est pas juste une partie d'un mot
    const regex = new RegExp(`\\b${targetLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(objet)) {
      return true
    }
  }
  
  // 2. Recherche du nom normalisé (si différent du nom original)
  if (targetNormalized !== targetLower) {
    const targetWords = targetNormalized.split(/\s+/).filter(w => w.length > 2)
    if (targetWords.length > 0) {
      // Vérifier que tous les mots significatifs sont présents
      const allWordsPresent = targetWords.every(word => {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i')
        return wordRegex.test(objet)
      })
      if (allWordsPresent) {
        return true
      }
    }
  }
  
  // 3. Recherche avec guillemets (ex: "Hangar Maritime")
  const quotedPattern = new RegExp(`["']${targetLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i')
  if (quotedPattern.test(objet)) {
    return true
  }
  
  return false
}

/**
 * Calcule le score de confiance d'une relation
 * 
 * Score basé sur :
 * - Fréquence des mentions (40%)
 * - Cohérence temporelle (30%)
 * - Longueur du nom (20%) - noms plus longs = moins de faux positifs
 * - Contexte relationnel (10%)
 * 
 * @param mentionCount - Nombre de mentions trouvées
 * @param years - Années où la relation apparaît
 * @param targetOrg - Nom de l'organisation cible
 * @returns Score de confiance (0-1)
 */
function calculateConfidence(
  mentionCount: number,
  years: string[],
  targetOrg: string
): number {
  // Score de fréquence (0-0.5)
  // Une seule mention = 0.3, 2 mentions = 0.4, 3+ = 0.5
  const frequencyScore = mentionCount === 1 ? 0.3 : Math.min(mentionCount / 2, 1) * 0.5
  
  // Score de cohérence temporelle (0-0.3)
  // 1 année = 0.15, 2+ années = 0.3
  const uniqueYears = new Set(years).size
  const temporalScore = uniqueYears === 1 ? 0.15 : Math.min(uniqueYears / 2, 1) * 0.3
  
  // Score de longueur du nom (0-0.15)
  // Noms plus longs = moins de faux positifs, mais on est moins strict
  const normalizedTarget = normalizeForDetection(targetOrg)
  const wordCount = normalizedTarget.split(/\s+/).filter(w => w.length > 2).length
  // 1 mot = 0.05, 2 mots = 0.1, 3+ mots = 0.15
  const lengthScore = wordCount === 1 ? 0.05 : Math.min(wordCount / 2, 1) * 0.15
  
  // Score de contexte (0-0.05) - toujours 0.05 si mentionCount > 0
  const contextScore = mentionCount > 0 ? 0.05 : 0
  
  const total = frequencyScore + temporalScore + lengthScore + contextScore
  
  // Minimum de 0.6 pour une mention valide (même si le calcul donne moins)
  return Math.max(total, 0.6)
}

/**
 * Crée un index inversé : Map nom d'organisation normalisé → subsides qui le mentionnent
 * 
 * @param subsides - Liste complète des subsides
 * @returns Map avec clé = nom normalisé, valeur = liste de subsides
 */
function createInvertedIndex(subsides: Subside[]): Map<string, Subside[]> {
  const index = new Map<string, Subside[]>()
  
  // Pour chaque organisation, créer une entrée dans l'index
  const orgNames = new Set<string>()
  subsides.forEach(subside => {
    if (subside.beneficiaire_begunstigde) {
      orgNames.add(subside.beneficiaire_begunstigde)
    }
  })
  
  // Pour chaque organisation, chercher les subsides qui la mentionnent
  orgNames.forEach(orgName => {
    const normalized = normalizeForDetection(orgName)
    if (!normalized || normalized.length < 3) {
      return // Ignorer les noms trop courts
    }
    
    const mentions: Subside[] = []
    
    subsides.forEach(subside => {
      // Ne pas chercher dans les subsides de l'organisation elle-même
      if (subside.beneficiaire_begunstigde === orgName) {
        return
      }
      
      const objet = subside.l_objet_de_la_subvention_doel_van_de_subsidie
      if (!objet) {
        return
      }
      
      if (detectMention(objet, normalized, orgName)) {
        mentions.push(subside)
      }
    })
    
    if (mentions.length > 0) {
      index.set(normalized, mentions)
    }
  })
  
  return index
}

/**
 * Détecte les relations entre organisations basées sur les mentions explicites
 * 
 * @param subsides - Liste complète des subsides
 * @param minConfidence - Score de confiance minimum (défaut: 0.75)
 * @returns Liste des relations détectées
 */
export function detectRelationships(
  subsides: Subside[],
  minConfidence: number = 0.6
): OrganizationRelationship[] {
  if (!subsides || subsides.length === 0) {
    return []
  }
  
  // Créer l'index inversé
  const index = createInvertedIndex(subsides)
  
  // Créer un Map des organisations uniques
  const orgMap = new Map<string, {
    originalName: string
    normalized: string
    subsides: Subside[]
  }>()
  
  subsides.forEach(subside => {
    const orgName = subside.beneficiaire_begunstigde
    if (!orgName) {
      return
    }
    
    const normalized = normalizeForDetection(orgName)
    if (!normalized || normalized.length < 3) {
      return
    }
    
    if (!orgMap.has(normalized)) {
      orgMap.set(normalized, {
        originalName: orgName,
        normalized,
        subsides: []
      })
    }
    
    orgMap.get(normalized)!.subsides.push(subside)
  })
  
  // Détecter les relations
  const relationships: OrganizationRelationship[] = []
  
  orgMap.forEach((sourceOrg, sourceNormalized) => {
    // Chercher si cette organisation est mentionnée dans d'autres subsides
    const mentions = index.get(sourceNormalized)
    
    if (!mentions || mentions.length === 0) {
      return
    }
    
    // Grouper les mentions par organisation source
    const mentionsBySource = new Map<string, {
      subsides: Subside[]
      years: Set<string>
    }>()
    
    mentions.forEach(subside => {
      const targetOrgName = subside.beneficiaire_begunstigde
      if (!targetOrgName) {
        return
      }
      
      const targetNormalized = normalizeForDetection(targetOrgName)
      if (!targetNormalized) {
        return
      }
      
      if (!mentionsBySource.has(targetNormalized)) {
        mentionsBySource.set(targetNormalized, {
          subsides: [],
          years: new Set()
        })
      }
      
      const group = mentionsBySource.get(targetNormalized)!
      group.subsides.push(subside)
      group.years.add(subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
    })
    
    // Créer les relations
    mentionsBySource.forEach((group, targetNormalized) => {
      const targetOrg = orgMap.get(targetNormalized)
      if (!targetOrg) {
        return
      }
      
      const mentionCount = group.subsides.length
      const years = Array.from(group.years)
      
      const confidence = calculateConfidence(
        mentionCount,
        years,
        targetOrg.originalName
      )
      
      if (confidence >= minConfidence) {
        relationships.push({
          sourceOrg: targetOrg.originalName, // L'organisation qui mentionne
          targetOrg: sourceOrg.originalName,  // L'organisation mentionnée
          confidence,
          mentionCount,
          years: years.sort(),
          contexts: group.subsides.map(s => ({
            objet: s.l_objet_de_la_subvention_doel_van_de_subsidie,
            annee: s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
            montant: s.montant_octroye_toegekend_bedrag
          }))
        })
      }
    })
  })
  
  // Trier par score de confiance décroissant
  return relationships.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Obtient les relations pour une organisation spécifique
 * 
 * @param orgName - Nom de l'organisation
 * @param subsides - Liste complète des subsides
 * @param minConfidence - Score de confiance minimum
 * @returns Liste des relations (bidirectionnelles)
 */
export function getRelationshipsForOrganization(
  orgName: string,
  subsides: Subside[],
  minConfidence: number = 0.75
): OrganizationRelationship[] {
  const allRelationships = detectRelationships(subsides, minConfidence)
  
  // Filtrer les relations où l'organisation est soit source soit cible
  return allRelationships.filter(rel => 
    rel.sourceOrg === orgName || rel.targetOrg === orgName
  )
}

