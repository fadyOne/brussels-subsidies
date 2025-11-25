/**
 * Types partagés pour l'application Brussels Subsidies
 * 
 * Ce fichier centralise les types pour éviter les dépendances circulaires
 * et faciliter la maintenance.
 */

export interface Subside {
  nom_de_la_subvention_naam_van_de_subsidie: string
  article_complet_volledig_artikel: string
  beneficiaire_begunstigde: string
  le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: string | null
  l_objet_de_la_subvention_doel_van_de_subsidie: string
  montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023: number
  montant_octroye_toegekend_bedrag: number
  l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: string
  l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: string
  // Champs pour compatibilité avec 2021
  nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie?: string
  article_budgetaire_begrotingsartikel?: string
  montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021?: string
}

