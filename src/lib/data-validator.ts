/**
 * Data Validator - Validation de schéma pour les données de subsides
 * 
 * ⚠️ PRINCIPE : Validation NON-BLOQUANTE
 * - Valide les données mais ne bloque pas le chargement si la validation échoue
 * - Log les erreurs pour le debugging
 * - Continue avec les données même si invalides
 * 
 * Cette approche garantit que l'application fonctionne toujours, même avec des données
 * partiellement invalides, tout en détectant les problèmes de qualité.
 */

import { z } from 'zod'

/**
 * Interface pour les résultats de validation
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Schéma de base très permissif pour les données brutes
 * Accepte tous les formats possibles selon les années (2019-2024)
 */
const RawSubsideSchema = z.object({
  // Champs communs (tous optionnels car varient selon l'année)
  nom_de_la_subvention_naam_van_de_subsidie: z.string().optional(),
  nom_du_subside_naam_subsidie: z.string().optional(),
  article_complet_volledig_artikel: z.string().optional(),
  article_budgetaire_begrotingsartikel: z.string().optional(),
  beneficiaire_begunstigde: z.string().optional(),
  nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: z.string().optional(),
  le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: z.union([z.string(), z.number(), z.null()]).optional(),
  numero_bce_kbo_nummer: z.union([z.string(), z.number(), z.null()]).optional(),
  l_objet_de_la_subvention_doel_van_de_subsidie: z.string().optional(),
  objet_du_subside_doel_van_de_subsidie: z.string().optional(),
  
  // Montants (peuvent être number, string avec format européen, ou null)
  montant_octroye_toegekend_bedrag: z.union([z.number(), z.string(), z.null()]).optional(),
  montant_prevu_au_budget_2020_bedrag_voorzien_op_begroting_2020: z.union([z.number(), z.string(), z.null()]).optional(),
  montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021: z.union([z.number(), z.string(), z.null()]).optional(),
  montant_prevu_au_budget_2022_bedrag_voorzien_op_begroting_2022: z.union([z.number(), z.string(), z.null()]).optional(),
  montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023: z.union([z.number(), z.string(), z.null()]).optional(),
  montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024: z.union([z.number(), z.string(), z.null()]).optional(),
  budget_2019_begroting_2019: z.union([z.number(), z.string(), z.null()]).optional(),
  
  // Années
  l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: z.union([z.string(), z.number()]).optional(),
  l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: z.union([z.string(), z.number()]).optional(),
  annee_budgetaire_debut_octroi_begroting_jaar_begin_toekenning: z.union([z.string(), z.number()]).optional(),
  annee_budgetaire_fin_octroi_begroting_jaar_einde_van_toekenning: z.union([z.string(), z.number()]).optional(),
  
  // Champs additionnels possibles
  ville_de_bruxelles_stad_brussel: z.string().optional(),
}).passthrough() // Permet des champs additionnels non définis

/**
 * Valide un objet de données brut
 * 
 * @param data - Données à valider
 * @param year - Année de référence (pour logging)
 * @returns Résultat de validation avec erreurs et avertissements
 */
export function validateRawSubside(
  data: unknown,
  year: string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Tentative de validation avec Zod
    const result = RawSubsideSchema.safeParse(data)

    if (!result.success) {
      // La validation a échoué, mais on ne bloque pas
      const zodErrors = result.error.issues.map((err: z.ZodIssue) => 
        `${err.path.join('.')}: ${err.message}`
      )
      warnings.push(...zodErrors)
      
      // Vérifications additionnelles pour les champs critiques
      if (typeof data !== 'object' || data === null) {
        errors.push(`Données invalides: attendu un objet, reçu ${typeof data}`)
        return { isValid: false, errors, warnings }
      }
    }

    // Vérifications additionnelles pour les champs critiques
    const obj = data as Record<string, unknown>
    
    // Vérifier qu'il y a au moins un champ de bénéficiaire
    const hasBeneficiary = 
      obj.beneficiaire_begunstigde ||
      obj.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie
    
    if (!hasBeneficiary) {
      warnings.push(`Aucun champ de bénéficiaire trouvé pour l'année ${year}`)
    }

    // Vérifier qu'il y a au moins un montant
    const hasAmount = 
      obj.montant_octroye_toegekend_bedrag ||
      obj.budget_2019_begroting_2019
    
    if (!hasAmount) {
      warnings.push(`Aucun montant trouvé pour l'année ${year}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error) {
    // Erreur inattendue lors de la validation
    const errorMessage = error instanceof Error ? error.message : String(error)
    errors.push(`Erreur de validation: ${errorMessage}`)
    return { isValid: false, errors, warnings }
  }
}

/**
 * Valide un tableau de données brutes
 * 
 * @param dataArray - Tableau de données à valider
 * @param year - Année de référence
 * @returns Statistiques de validation
 */
export function validateRawSubsidesArray(
  dataArray: unknown[],
  year: string
): {
  total: number
  valid: number
  invalid: number
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  let valid = 0
  let invalid = 0

  if (!Array.isArray(dataArray)) {
    errors.push(`Données invalides: attendu un tableau, reçu ${typeof dataArray}`)
    return { total: 0, valid: 0, invalid: 0, errors, warnings }
  }

  dataArray.forEach((item, index) => {
    const result = validateRawSubside(item, year)
    
    if (result.isValid && result.warnings.length === 0) {
      valid++
    } else {
      invalid++
      if (result.errors.length > 0) {
        errors.push(`Item ${index}: ${result.errors.join(', ')}`)
      }
      if (result.warnings.length > 0) {
        warnings.push(`Item ${index}: ${result.warnings.join(', ')}`)
      }
    }
  })

  // Logger les résultats (seulement si des problèmes sont détectés)
  if (invalid > 0 || warnings.length > 0) {
    console.warn(`[Validation ${year}] ${valid}/${dataArray.length} items valides, ${invalid} avec avertissements`)
    if (errors.length > 0) {
      console.error(`[Validation ${year}] Erreurs détectées:`, errors.slice(0, 5)) // Limiter à 5 pour éviter le spam
    }
    if (warnings.length > 0 && warnings.length <= 10) {
      console.warn(`[Validation ${year}] Avertissements:`, warnings.slice(0, 10))
    }
  } else {
    console.log(`[Validation ${year}] ✅ Toutes les données sont valides (${dataArray.length} items)`)
  }

  return {
    total: dataArray.length,
    valid,
    invalid,
    errors: errors.slice(0, 20), // Limiter pour éviter le spam
    warnings: warnings.slice(0, 20),
  }
}

