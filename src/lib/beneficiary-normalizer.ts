/**
 * Beneficiary Normalizer - Normalisation et regroupement dynamique des bénéficiaires
 * 
 * Ce module fournit des fonctions génériques pour normaliser et regrouper les bénéficiaires
 * de manière dynamique, sans règles hardcodées spécifiques à une région ou organisation.
 * 
 * Approche :
 * 1. Normalisation agressive des noms (suppression accents, casse, ponctuation)
 * 2. Regroupement par nom normalisé (détecte automatiquement les variantes)
 * 3. Regroupement par numéro BCE (identifiants uniques)
 * 4. Similarité de chaînes (détection des noms proches)
 */

import type { Subside } from './types'

/**
 * Normalise un nom de bénéficiaire de manière agressive pour le regroupement
 * 
 * Cette fonction applique une normalisation stricte pour regrouper automatiquement
 * les variantes : "parking.brussels", "Parking.brussels", "PARKING.BRUSSELS" → même clé
 * 
 * @param name - Nom original du bénéficiaire
 * @returns Nom normalisé pour le regroupement
 */
export function normalizeBeneficiaryName(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  let normalized = name.trim()
  
  // 1. Convertir en minuscules
  normalized = normalized.toLowerCase()
  
  // 2. Normaliser Unicode (NFD) et supprimer les accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // 3. Remplacer les points, tirets, slashes, pipes par des espaces
  // (parking.brussels → parking brussels)
  normalized = normalized.replace(/[.\-\/|_]/g, ' ')
  
  // 4. Supprimer tous les caractères non-alphanumériques (sauf espaces)
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ')
  
  // 5. Supprimer les suffixes légaux courants (ASBL, VZW, SCRL, etc.) pour améliorer le regroupement
  // Ces suffixes sont souvent omis ou varient, donc on les ignore pour le regroupement
  const legalSuffixes = ['asbl', 'vzw', 'scrl', 'sprl', 'sa', 'nv', 'bv', 'cv', 'sc', 'srl', 'bvba', 'cvba']
  legalSuffixes.forEach(suffix => {
    // Supprimer le suffixe s'il est à la fin du nom
    const suffixRegex = new RegExp(`\\s+${suffix}\\s*$`, 'i')
    normalized = normalized.replace(suffixRegex, '')
  })
  
  // 6. Supprimer les mots communs qui n'apportent pas d'information
  const stopWords = ['de', 'du', 'la', 'le', 'les', 'des', 'van', 'der', 'den', 'het', 'een', 'the', 'of', 'and']
  const words = normalized.split(/\s+/).filter(word => 
    word.length > 0 && !stopWords.includes(word)
  )
  normalized = words.join(' ')
  
  // 7. Normaliser les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Interface pour un groupe de bénéficiaires similaires
 */
export interface BeneficiaryGroup {
  /** Clé de regroupement (nom normalisé ou numéro BCE) */
  key: string
  /** Nom d'affichage (le plus fréquent ou le plus représentatif) */
  displayName: string
  /** Tous les noms originaux dans ce groupe */
  originalNames: Set<string>
  /** Numéro BCE si disponible (unique pour le groupe) */
  bceNumber: string | null
  /** Nombre total de subsides dans ce groupe */
  count: number
  /** Montant total agrégé */
  totalAmount: number
}

/**
 * Regroupe les bénéficiaires par nom normalisé
 * 
 * Détecte automatiquement les variantes comme :
 * - "parking.brussels" et "Parking.brussels"
 * - "CPAS Bruxelles" et "C.P.A.S. Bruxelles"
 * 
 * @param subsides - Liste des subsides à analyser
 * @returns Map avec clé = nom normalisé, valeur = groupe de bénéficiaires
 */
export function groupByNormalizedName(subsides: Subside[]): Map<string, BeneficiaryGroup> {
  const groups = new Map<string, BeneficiaryGroup>()
  
  subsides.forEach((subside) => {
    const normalized = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
    
    if (!normalized) {
      return // Ignorer les noms vides
    }
    
    const existing = groups.get(normalized)
    
    if (existing) {
      // Ajouter le nom original au groupe existant
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      existing.count += 1
      existing.totalAmount += subside.montant_octroye_toegekend_bedrag
      
      // Mettre à jour le numéro BCE si disponible
      if (subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie && !existing.bceNumber) {
        existing.bceNumber = subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie
      }
    } else {
      // Créer un nouveau groupe
      groups.set(normalized, {
        key: normalized,
        displayName: subside.beneficiaire_begunstigde, // Utiliser le premier nom trouvé
        originalNames: new Set([subside.beneficiaire_begunstigde]),
        bceNumber: subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie,
        count: 1,
        totalAmount: subside.montant_octroye_toegekend_bedrag,
      })
    }
  })
  
  // Améliorer les noms d'affichage : utiliser le nom le plus court ou le plus fréquent
  groups.forEach((group) => {
    if (group.originalNames.size > 1) {
      // Si plusieurs noms, choisir le plus court (généralement le plus propre)
      const names = Array.from(group.originalNames)
      names.sort((a, b) => a.length - b.length)
      group.displayName = names[0]
    }
  })
  
  return groups
}

/**
 * Regroupe les bénéficiaires par numéro BCE (identifiant unique)
 * 
 * Les numéros BCE sont des identifiants uniques par organisation légale.
 * Si deux bénéficiaires ont le même BCE, c'est la même organisation.
 * 
 * @param subsides - Liste des subsides à analyser
 * @returns Map avec clé = numéro BCE, valeur = groupe de bénéficiaires
 */
export function groupByBCE(subsides: Subside[]): Map<string, BeneficiaryGroup> {
  const groups = new Map<string, BeneficiaryGroup>()
  
  subsides.forEach((subside) => {
    const bce = subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie
    
    if (!bce || bce.trim() === '') {
      return // Ignorer les subsides sans BCE
    }
    
    const bceKey = bce.trim()
    const existing = groups.get(bceKey)
    
    if (existing) {
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      existing.count += 1
      existing.totalAmount += subside.montant_octroye_toegekend_bedrag
    } else {
      groups.set(bceKey, {
        key: bceKey,
        displayName: subside.beneficiaire_begunstigde,
        originalNames: new Set([subside.beneficiaire_begunstigde]),
        bceNumber: bceKey,
        count: 1,
        totalAmount: subside.montant_octroye_toegekend_bedrag,
      })
    }
  })
  
  return groups
}

/**
 * Combine le regroupement par normalisation et par BCE
 * 
 * ⚠️ PRIORITÉ INVERSE : Nom normalisé > BCE
 * Les numéros BCE ne sont pas fiables (ex: "Seven Shelters" a 2 BCE différents).
 * On regroupe d'abord par nom normalisé, puis on utilise les BCE comme information supplémentaire.
 * 
 * @param subsides - Liste des subsides à analyser
 * @returns Map avec les groupes de bénéficiaires
 */
export function groupBeneficiaries(subsides: Subside[]): Map<string, BeneficiaryGroup> {
  const normalizedGroups = groupByNormalizedName(subsides)
  const bceGroups = groupByBCE(subsides)
  const finalGroups = new Map<string, BeneficiaryGroup>()
  
  // Créer un Set des noms déjà dans un groupe normalisé pour vérification rapide
  const namesInNormalizedGroups = new Set<string>()
  normalizedGroups.forEach((group) => {
    group.originalNames.forEach(name => namesInNormalizedGroups.add(name))
  })
  
  // D'abord, ajouter tous les groupes par nom normalisé (PRIORITÉ)
  normalizedGroups.forEach((group, normalizedKey) => {
    finalGroups.set(`norm:${normalizedKey}`, group)
  })
  
  // Ensuite, ajouter les groupes avec BCE uniquement s'ils ne sont pas déjà dans un groupe normalisé
  // (pour les cas où un bénéficiaire a un BCE mais n'a pas de nom normalisé correspondant)
  bceGroups.forEach((group, bceKey) => {
    // Vérifier si un des noms de ce groupe BCE est déjà dans un groupe normalisé
    let alreadyGrouped = false
    for (const name of group.originalNames) {
      if (namesInNormalizedGroups.has(name)) {
        alreadyGrouped = true
        break
      }
    }
    
    // Si pas déjà groupé par nom normalisé, ajouter le groupe BCE
    // (cas rare : bénéficiaire avec BCE mais nom non normalisable)
    if (!alreadyGrouped) {
      finalGroups.set(`bce:${bceKey}`, group)
    }
  })
  
  return finalGroups
}

/**
 * Obtient le nom d'affichage pour un bénéficiaire
 * 
 * Utilise le regroupement dynamique pour trouver le nom le plus représentatif
 * d'un groupe de bénéficiaires similaires.
 * 
 * @param name - Nom original du bénéficiaire
 * @param subsides - Liste complète des subsides (pour le regroupement)
 * @returns Nom d'affichage (normalisé si groupe trouvé, sinon nom original)
 */
export function getDisplayName(name: string, subsides: Subside[]): string {
  const groups = groupBeneficiaries(subsides)
  
  // Chercher dans tous les groupes
  for (const group of groups.values()) {
    if (group.originalNames.has(name)) {
      return group.displayName
    }
  }
  
  // Si pas trouvé, retourner le nom original
  return name
}

