/**
 * Tests pour le normalizer de données
 * 
 * ⚠️ IMPORTANT : Ces tests valident le comportement actuel de la normalisation
 * pour éviter les régressions lors des refactorisations futures.
 */

import { describe, it, expect } from 'vitest'
import { parseAmount, normalizeSubsideData } from '../data-normalizer'

describe('parseAmount', () => {
  it('devrait parser un nombre correctement', () => {
    expect(parseAmount(1234.56)).toBe(1234.56)
    expect(parseAmount(0)).toBe(0)
    expect(parseAmount(1000000)).toBe(1000000)
  })

  it('devrait parser un string avec format européen (1.234,56)', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
    expect(parseAmount('10.000,50')).toBe(10000.5)
    expect(parseAmount('0,99')).toBe(0.99)
  })

  it('devrait retourner 0 pour des valeurs invalides', () => {
    expect(parseAmount(null)).toBe(0)
    expect(parseAmount(undefined)).toBe(0)
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
  })

  it('devrait gérer les strings avec virgule simple', () => {
    expect(parseAmount('1234,56')).toBe(1234.56)
  })
})

describe('normalizeSubsideData', () => {
  it('devrait normaliser des données complètes', () => {
    const rawData = {
      beneficiaire_begunstigde: 'Test ASBL',
      article_complet_volledig_artikel: 'ART-2024-001',
      l_objet_de_la_subvention_doel_van_de_subsidie: 'Projet test',
      nom_de_la_subvention_naam_van_de_subsidie: 'Subside Test',
      montant_octroye_toegekend_bedrag: '1.500,00',
      montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024: '2.000,00',
      le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: '1234567890',
      l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: '2024',
      l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: '2025',
    }

    const result = normalizeSubsideData(rawData, '2024')

    expect(result.beneficiaire_begunstigde).toBe('Test ASBL')
    expect(result.article_complet_volledig_artikel).toBe('ART-2024-001')
    expect(result.montant_octroye_toegekend_bedrag).toBe(1500)
    expect(result.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023).toBe(2000)
    expect(result.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie).toBe('1234567890')
  })

  it('devrait utiliser des valeurs par défaut pour les champs manquants', () => {
    const rawData = {}

    const result = normalizeSubsideData(rawData, '2024')

    expect(result.beneficiaire_begunstigde).toBe('Non spécifié')
    expect(result.article_complet_volledig_artikel).toBe('Non spécifié')
    expect(result.montant_octroye_toegekend_bedrag).toBe(0)
    expect(result.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend).toBe('2024')
  })

  it('devrait gérer les formats alternatifs de champs (compatibilité 2019-2021)', () => {
    const rawData = {
      nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: 'Old Format ASBL',
      article_budgetaire_begrotingsartikel: 'OLD-ART-001',
      objet_du_subside_doel_van_de_subsidie: 'Old object',
      nom_du_subside_naam_subsidie: 'Old subside',
      budget_2019_begroting_2019: '500,00',
      numero_bce_kbo_nummer: '9876543210',
    }

    const result = normalizeSubsideData(rawData, '2019')

    expect(result.beneficiaire_begunstigde).toBe('Old Format ASBL')
    expect(result.article_complet_volledig_artikel).toBe('OLD-ART-001')
    expect(result.l_objet_de_la_subvention_doel_van_de_subsidie).toBe('Old object')
    expect(result.nom_de_la_subvention_naam_van_de_subsidie).toBe('Old subside')
    expect(result.montant_octroye_toegekend_bedrag).toBe(500)
    expect(result.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie).toBe('9876543210')
  })

  it('devrait calculer l\'année de fin par défaut si absente', () => {
    const rawData = {}
    const result = normalizeSubsideData(rawData, '2024')
    
    expect(result.l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend).toBe('2025')
  })

  it('devrait inclure les champs de compatibilité', () => {
    const rawData = {
      beneficiaire_begunstigde: 'Test',
      article_complet_volledig_artikel: 'ART-001',
      montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024: '1000',
    }

    const result = normalizeSubsideData(rawData, '2024')

    // Vérifier les champs de compatibilité
    expect(result.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie).toBe('Test')
    expect(result.article_budgetaire_begrotingsartikel).toBe('ART-001')
    expect(result.montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021).toBe('1000')
  })

  it('devrait gérer null pour le numéro BCE', () => {
    const rawData = {}
    const result = normalizeSubsideData(rawData, '2024')
    
    expect(result.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie).toBeNull()
  })
})

