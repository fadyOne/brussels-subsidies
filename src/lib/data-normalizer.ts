/**
 * Data Normalizer - Normalise les données de subsides depuis différents formats JSON
 * 
 * Ce module extrait la logique de normalisation pour éviter la duplication de code
 * et faciliter les tests et la maintenance.
 * 
 * ⚠️ RISQUES IDENTIFIÉS :
 * - Les différents formats d'années (2019-2024) peuvent avoir des champs différents
 * - Les types doivent être strictement respectés pour éviter les erreurs silencieuses
 * - La fonction parseAmount doit gérer tous les formats de nombres possibles
 */

import type { Subside } from './types'

/**
 * Type pour les données brutes non normalisées
 */
export interface RawSubsideData {
  [key: string]: unknown
}

/**
 * Parse un montant depuis différents formats possibles
 * 
 * @param value - Valeur à parser (number, string avec format européen, etc.)
 * @returns Le montant en nombre, ou 0 si invalide
 * 
 * ⚠️ RISQUE : Cette fonction doit gérer tous les formats possibles :
 * - Nombres purs : 1234.56
 * - Strings avec points : "1.234,56"
 * - Strings avec virgules : "1234,56"
 * - Valeurs null/undefined
 */
export function parseAmount(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }
  
  if (typeof value === 'string') {
    // Format européen : "1.234,56" -> 1234.56
    // Enlève les points (séparateurs de milliers) et remplace la virgule par un point
    const cleaned = value.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

/**
 * Normalise un objet de données brut en objet Subside typé
 * 
 * @param item - Données brutes depuis le JSON
 * @param year - Année de référence pour les valeurs par défaut
 * @returns Objet Subside normalisé
 * 
 * ⚠️ RISQUES IDENTIFIÉS :
 * - Les noms de champs varient selon les années (2019 vs 2020-2024)
 * - Certains champs peuvent être manquants et doivent avoir des valeurs par défaut
 * - Le numéro BCE peut être dans différents champs selon l'année
 */
export function normalizeSubsideData(
  item: unknown,
  year: string
): Subside {
  const data = item as RawSubsideData

  // Extraction du bénéficiaire (plusieurs noms possibles selon l'année)
  const beneficiaire = String(
    data.beneficiaire_begunstigde || 
    data.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
    "Non spécifié"
  )

  // Extraction de l'article budgétaire
  const article = String(
    data.article_complet_volledig_artikel || 
    data.article_budgetaire_begrotingsartikel || 
    "Non spécifié"
  )

  // Extraction de l'objet de la subvention
  const objet = String(
    data.l_objet_de_la_subvention_doel_van_de_subsidie || 
    data.objet_du_subside_doel_van_de_subsidie || 
    "Non spécifié"
  )

  // Extraction du nom de la subvention
  const nomSubside = String(
    data.nom_de_la_subvention_naam_van_de_subsidie || 
    data.nom_du_subside_naam_subsidie || 
    "Non spécifié"
  )

  // Extraction du montant octroyé (plusieurs champs possibles)
  const montant = parseAmount(
    data.montant_octroye_toegekend_bedrag || 
    data.budget_2019_begroting_2019
  )

  // Extraction du montant prévu (varie selon l'année)
  const montantPrevu = parseAmount(
    data.montant_prevu_au_budget_2020_bedrag_voorzien_op_begroting_2020 ||
    data.montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021 ||
    data.montant_prevu_au_budget_2022_bedrag_voorzien_op_begroting_2022 ||
    data.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 ||
    data.montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024 ||
    data.budget_2019_begroting_2019
  )

  // Extraction de l'année de début (plusieurs champs possibles)
  const anneeDebut = String(
    data.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend ||
    data.annee_budgetaire_debut_octroi_begroting_jaar_begin_toekenning ||
    year
  )

  // Extraction de l'année de fin (plusieurs champs possibles)
  const anneeFin = String(
    data.l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend ||
    data.annee_budgetaire_fin_octroi_begroting_jaar_einde_van_toekenning ||
    (parseInt(year) + 1).toString()
  )

  // Extraction du numéro BCE (plusieurs champs possibles)
  const bceNumber = data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie 
    ? String(data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie)
    : (data.numero_bce_kbo_nummer ? String(data.numero_bce_kbo_nummer) : null)

  // Construction de l'objet normalisé
  return {
    nom_de_la_subvention_naam_van_de_subsidie: nomSubside,
    article_complet_volledig_artikel: article,
    beneficiaire_begunstigde: beneficiaire,
    le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: bceNumber,
    l_objet_de_la_subvention_doel_van_de_subsidie: objet,
    montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023: montantPrevu,
    montant_octroye_toegekend_bedrag: montant,
    l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: anneeDebut,
    l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: anneeFin,
    // Champs pour compatibilité avec les anciennes versions
    nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
    article_budgetaire_begrotingsartikel: article,
    montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021: String(montantPrevu),
  }
}

/**
 * Normalise un tableau de données brutes en tableau de Subsides
 * 
 * @param rawData - Tableau de données brutes depuis le JSON
 * @param year - Année de référence pour les valeurs par défaut
 * @returns Tableau de Subsides normalisés
 */
export function normalizeSubsidesArray(
  rawData: unknown[],
  year: string
): Subside[] {
  return rawData.map((item) => normalizeSubsideData(item, year))
}

