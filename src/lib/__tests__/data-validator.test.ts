import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateRawSubside, validateRawSubsidesArray } from '../data-validator'

describe('validateRawSubside', () => {
  it('devrait valider des données complètes de 2024', () => {
    const data2024 = {
      article_budgetaire_begrotingsartikel: "76410/33202",
      nom_de_la_subvention_naam_van_de_subsidie: "Subside test",
      nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Test Beneficiary",
      le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: "123456789",
      objet_du_subside_doel_van_de_subsidie: "Test object",
      montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024: 10000.0,
      montant_octroye_toegekend_bedrag: 9500.0,
      l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: "2024",
      l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: "2026"
    }

    const result = validateRawSubside(data2024, "2024")
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('devrait valider des données de 2019 avec format alternatif', () => {
    const data2019 = {
      ville_de_bruxelles_stad_brussel: "Ville de Bruxelles / Stad Brussel",
      nom_du_subside_naam_subsidie: "Subside test 2019",
      beneficiaire_begunstigde: "Test Beneficiary 2019",
      numero_bce_kbo_nummer: "987654321",
      objet_du_subside_doel_van_de_subsidie: "Test object 2019",
      budget_2019_begroting_2019: "10.000,00",
      annee_budgetaire_debut_octroi_begroting_jaar_begin_toekenning: "2019",
      annee_budgetaire_fin_octroi_begroting_jaar_einde_van_toekenning: "2019"
    }

    const result = validateRawSubside(data2019, "2019")
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('devrait accepter des données avec champs manquants (non-bloquant)', () => {
    const partialData = {
      nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Partial Beneficiary"
    }

    const result = validateRawSubside(partialData, "2024")
    // Devrait être valide mais avec des avertissements
    expect(result.isValid).toBe(true) // Pas d'erreurs bloquantes
    expect(result.warnings.length).toBeGreaterThan(0) // Mais des avertissements
  })

  it('devrait gérer null pour le numéro BCE', () => {
    const dataWithNullBCE = {
      nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Test",
      le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: null,
      montant_octroye_toegekend_bedrag: 1000
    }

    const result = validateRawSubside(dataWithNullBCE, "2024")
    expect(result.isValid).toBe(true)
  })

  it('devrait gérer des données invalides gracieusement', () => {
    const invalidData = "not an object"

    const result = validateRawSubside(invalidData, "2024")
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('validateRawSubsidesArray', () => {
  beforeEach(() => {
    // Mock console pour éviter le spam dans les tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('devrait valider un tableau de données valides', () => {
    const validData = [
      {
        nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Test 1",
        montant_octroye_toegekend_bedrag: 1000
      },
      {
        nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Test 2",
        montant_octroye_toegekend_bedrag: 2000
      }
    ]

    const result = validateRawSubsidesArray(validData, "2024")
    expect(result.total).toBe(2)
    expect(result.valid).toBeGreaterThanOrEqual(0) // Peut avoir des warnings mais pas d'erreurs
    expect(result.errors).toHaveLength(0)
  })

  it('devrait gérer un tableau vide', () => {
    const result = validateRawSubsidesArray([], "2024")
    expect(result.total).toBe(0)
    expect(result.valid).toBe(0)
    expect(result.invalid).toBe(0)
  })

  it('devrait gérer des données non-tableau gracieusement', () => {
    const result = validateRawSubsidesArray("not an array" as unknown as unknown[], "2024")
    expect(result.total).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('devrait continuer même avec des données partiellement invalides', () => {
    const mixedData = [
      {
        nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Valid",
        montant_octroye_toegekend_bedrag: 1000
      },
      {
        // Données incomplètes mais acceptables
        nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: "Partial"
      }
    ]

    const result = validateRawSubsidesArray(mixedData, "2024")
    expect(result.total).toBe(2)
    // Devrait traiter toutes les données même si certaines ont des warnings
    expect(result.errors).toHaveLength(0) // Pas d'erreurs bloquantes
  })
})

