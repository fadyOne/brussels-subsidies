"use client"
import { LoadingScreen } from "@/components/LoadingScreen"
import { CustomTooltip } from "@/components/CustomTooltip"
import { NivoBarChart } from "@/components/NivoBarChart"
import { Top10PieChart } from "@/components/Top10PieChart"
import { Top10ListChart } from "@/components/Top10ListChart"
import { PieChartLegend } from "@/components/PieChartLegend"
import { ChartSkeleton } from "@/components/ChartSkeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, RefreshCw, PieChart as PieChartIcon, Search, X } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { Subside } from '@/lib/types'
import { normalizeSubsidesArray } from '@/lib/data-normalizer'
import { getCachedData, setCachedData } from '@/lib/cache'
import { groupBeneficiaries, normalizeBeneficiaryName as normalizeBeneficiaryNameDynamic } from '@/lib/beneficiary-normalizer'
import { useResponsiveChart } from '@/lib/use-responsive-chart'
import { categorizeSubside } from '@/lib/category-config'
import { createFilterPreset, loadFilterPreset } from '@/lib/filter-presets'
import { devLog, devWarn, devError } from '@/lib/utils'

const COLORS = [
  "#3B82F6", // Bleu vif
  "#10B981", // Vert émeraude
  "#F59E0B", // Orange ambré
  "#EF4444", // Rouge vif
  "#FBBF24", // Jaune
  "#06B6D4", // Cyan
  "#84CC16", // Vert lime
  "#F97316", // Orange
  "#EC4899", // Rose
  "#6366F1"  // Indigo
]

// Note: categorizeSubside is now imported from @/lib/category-config
// This allows for dynamic, configurable categorization
// The configuration supports sub-categories for Culture (Musique & Festivals, Arts Visuels, etc.)

// Fonction pour normaliser les noms de bénéficiaires (regroupe les variantes)
// Note: normalizeBeneficiaryName() a été déplacée dans src/lib/beneficiary-normalizer.ts
// et est maintenant utilisée via le système de regroupement dynamique

// Fonction pour identifier le type d'organisation (regroupement par type)
/**
 * Crée un cache de mapping nom -> nom d'affichage basé sur le regroupement dynamique
 * 
 * Cette fonction remplace l'ancienne version avec règles statiques hardcodées.
 * Elle utilise maintenant le regroupement automatique basé sur :
 * - Normalisation des noms (variantes détectées automatiquement)
 * - Numéros BCE (même organisation légale)
 * 
 * @param subsides - Liste complète des subsides (pour le regroupement)
 * @returns Map avec clé = nom original, valeur = nom d'affichage (regroupé)
 */
function createBeneficiaryTypeCache(subsides: Subside[]): Map<string, string> {
  const cache = new Map<string, string>()
  const groups = groupBeneficiaries(subsides)
  
  // Créer le cache : pour chaque groupe, mapper tous les noms originaux vers le displayName
  groups.forEach((group) => {
    group.originalNames.forEach((originalName) => {
      cache.set(originalName, group.displayName)
    })
  })
  
  return cache
}

/**
 * Obtient le type/nom d'affichage d'un bénéficiaire depuis le cache
 * 
 * @param name - Nom original du bénéficiaire
 * @param cache - Cache de mapping nom -> nom d'affichage
 * @returns Nom d'affichage (regroupé si variantes détectées, sinon nom original)
 */
function getBeneficiaryType(name: string, cache: Map<string, string>): string {
  return cache.get(name) || name
}



export default function AnalysePage() {
  const [subsides, setSubsides] = useState<Subside[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDataYear, setSelectedDataYear] = useState<string>("all")
  // États pour la comparaison entre années
  const [comparisonCategoryFilter, setComparisonCategoryFilter] = useState<string>("all")
  const [selectedComparisonYears, setSelectedComparisonYears] = useState<string[]>([])
  // État pour le sous-onglet de comparaison (organisations ou global)
  const [comparisonView, setComparisonView] = useState<"organizations" | "global">("organizations")
  // États pour la comparaison d'organisations (tableaux pour plusieurs organisations)
  const [selectedOrg1, setSelectedOrg1] = useState<string[]>([])
  const [selectedOrg2, setSelectedOrg2] = useState<string[]>([])
  const [orgSearch1, setOrgSearch1] = useState<string>("")
  const [orgSearch2, setOrgSearch2] = useState<string>("")
  // Comparaison automatique : affichée dès qu'il y a au moins une organisation de chaque côté
  const showComparison = useMemo(() => {
    return selectedOrg1.length > 0 && selectedOrg2.length > 0
  }, [selectedOrg1.length, selectedOrg2.length])
  // État pour le nombre de bénéficiaires à afficher
  const topBeneficiariesCount = 10 // Fixé à 10, sélecteur retiré
  
  // État pour le type de graphique (pie, list, bar)
  // Par défaut: 'list' sur mobile, 'pie' sur desktop
  const [top10ChartType, setTop10ChartType] = useState<'pie' | 'list' | 'bar'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 'list' : 'pie' // 640px = sm breakpoint
    }
    return 'pie'
  })
  
  // Responsive chart props
  const responsiveProps = useResponsiveChart()
  
  // Debounce pour éviter trop de clics rapides
  const lastClickTime = useRef<number>(0)
  const CLICK_DEBOUNCE_MS = 500 // 500ms entre clics
  
  // Handler pour clic sur barre de graphique (création de preset + redirection)
  const handleBarClick = useCallback((barData: { name: string; value: number; [key: string]: unknown }) => {
    const now = Date.now()
    
    // Debounce: ignorer les clics trop rapides
    if (now - lastClickTime.current < CLICK_DEBOUNCE_MS) {
      devLog('[Analyse] Click ignored (debounce)')
      return
    }
    lastClickTime.current = now
    
    try {
      const beneficiaryName = barData.name
      
      // Vérifier que le nom n'est pas trop long (sécurité)
      if (typeof beneficiaryName !== 'string' || beneficiaryName.length > 10000) {
        devWarn('[Analyse] Beneficiary name too long, skipping preset creation')
        return
      }
      
      // Créer un preset de filtre pour ce bénéficiaire
      // IMPORTANT: Créer AVANT la redirection pour s'assurer qu'il existe
      const filterId = createFilterPreset(
        {
          search: beneficiaryName,
          year: selectedDataYear !== 'all' ? selectedDataYear : undefined,
        },
        'beneficiary'
      )
      
      if (!filterId) {
        devWarn('[Analyse] Failed to create filter preset, cannot redirect')
        return
      }
      
      // Vérifier que le preset existe bien avant redirection (double sécurité)
      // Note: loadFilterPreset vérifie aussi l'expiration
      const verifyPreset = loadFilterPreset(filterId)
      if (!verifyPreset) {
        devError('[Analyse] Preset created but not found, aborting redirect')
        return
      }
      
      devLog(`[Analyse] Created filter preset ${filterId} for beneficiary: ${beneficiaryName.substring(0, 50)}...`)
      
      // Construire l'URL de redirection
      // Utiliser window.location.origin pour éviter les problèmes de base path
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const searchUrl = new URL('/?filter=' + filterId, baseUrl)
      
      // Valider l'URL avant navigation
      try {
        // Vérifier que l'URL est valide
        if (!searchUrl.href || searchUrl.href === 'undefined') {
          throw new Error('Invalid URL generated')
        }
        
        // Rediriger vers la page de recherche avec le preset
        devLog(`[Analyse] Redirecting to: ${searchUrl.href}`)
        window.location.href = searchUrl.href
      } catch (urlError) {
        devError('[Analyse] Error constructing redirect URL:', urlError)
        // Fallback: essayer avec une URL simple
        try {
          window.location.href = `/?filter=${filterId}`
        } catch (fallbackError) {
          devError('[Analyse] Fallback redirect also failed:', fallbackError)
        }
      }
    } catch (error) {
      devError('[Analyse] Error handling bar click:', error)
    }
  }, [selectedDataYear])

  // Fonction pour détecter automatiquement les années disponibles
  const getAvailableYears = useCallback(async (): Promise<string[]> => {
    try {
      // Limiter aux années qui existent réellement pour éviter les 404
      const possibleYears = ["2024", "2023", "2022", "2021", "2020", "2019"]
      const years: string[] = ["all"]
      
      for (const year of possibleYears) {
        try {
          const response = await fetch(`/data-${year}.json`, { method: 'HEAD' })
          if (response.ok) {
            years.push(year)
          }
        } catch {
          // Fichier n'existe pas, continuer silencieusement
        }
      }
      
      return years
    } catch (error) {
      devError("Erreur lors de la détection des années:", error)
      return ["all", "2024", "2023", "2022", "2021", "2020", "2019"]
    }
  }, [])

  // Charger les données depuis le fichier JSON
  const loadData = useCallback(async (dataYear: string = selectedDataYear) => {
    try {
      setLoading(true)
      setError(null)

      // Vérifier le cache en premier
      const cachedData = getCachedData(dataYear)
      if (cachedData) {
        setSubsides(cachedData)
        setLoading(false)
        return
      }

      let allData: Subside[] = []

      if (dataYear === "all") {
        const detectedYears = await getAvailableYears()
        
        const years = detectedYears.filter((year: string) => year !== "all")
        
        const yearPromises = years.map(async (year: string) => {
          try {
            // Essayer d'abord les fichiers validés, puis fallback vers les originaux
            let jsonData = await fetch(`/data-${year}-validated.json`)
            
            if (!jsonData.ok) {
              // Fallback vers le fichier original
              jsonData = await fetch(`/data-${year}.json`)
              if (!jsonData.ok) {
                return null
              }
            }
            
            const rawData: unknown[] = await jsonData.json()
            
            if (rawData && rawData.length > 0) {
              // Les fichiers validés sont déjà normalisés, mais on applique quand même la normalisation
              // pour s'assurer de la cohérence (les flags _validationStatus seront préservés)
              const normalizedData = normalizeSubsidesArray(rawData, year)
              return normalizedData
            }
            return null
          } catch {
            return null
          }
        })
        
        const results = await Promise.all(yearPromises)
        allData = results.filter((data: Subside[] | null): data is Subside[] => data !== null).flat()
        
        if (allData.length === 0) {
          throw new Error("Aucune donnée récupérée pour toutes les années")
        }
      } else {
        // Essayer d'abord les fichiers validés, puis fallback vers les originaux
        let jsonData = await fetch(`/data-${dataYear}-validated.json`)
        
        if (!jsonData.ok) {
          // Fallback vers le fichier original
          jsonData = await fetch(`/data-${dataYear}.json`)
          if (!jsonData.ok) {
            throw new Error(`HTTP error! status: ${jsonData.status}`)
          }
        }
        
        const rawData: unknown[] = await jsonData.json()

        if (rawData && rawData.length > 0) {
          // Les fichiers validés sont déjà normalisés, mais on applique quand même la normalisation
          // pour s'assurer de la cohérence (les flags _validationStatus seront préservés)
          const normalizedData = normalizeSubsidesArray(rawData, dataYear)
          allData = normalizedData
        } else {
          throw new Error(`Aucune donnée récupérée depuis le fichier data-${dataYear}.json`)
        }
      }

      setSubsides(allData)
      
      setCachedData(allData, dataYear)
      
    } catch (apiError) {
      devError("❌ Erreur chargement JSON:", apiError)
      setError(`Erreur lors du chargement des données: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
    } finally {
      setLoading(false)
    }
  }, [selectedDataYear, getAvailableYears])

  useEffect(() => {
    // Charger les paramètres URL en premier
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const year = urlParams.get('year')
      if (year) setSelectedDataYear(year)
    }
    
    loadData(selectedDataYear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataYear]) // loadData est stable grâce à useCallback, on utilise seulement selectedDataYear




  const yearData = subsides
    .reduce(
      (acc, subside) => {
        const existing = acc.find(
          (item) =>
            item.name ===
            subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
        )
        if (existing) {
          existing.value += subside.montant_octroye_toegekend_bedrag
          existing.count += 1
        } else {
          acc.push({
            name: subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
            value: subside.montant_octroye_toegekend_bedrag,
            count: 1,
          })
        }
        return acc
      },
      [] as { name: string; value: number; count: number }[],
    )
    .sort((a, b) => Number.parseInt(a.name) - Number.parseInt(b.name))

  const uniqueCategories = [...new Set(subsides.map((s) => categorizeSubside(s.l_objet_de_la_subvention_doel_van_de_subsidie)))]

  // Cache de regroupement des bénéficiaires (calculé une seule fois)
  const beneficiaryTypeCache = useMemo(() => {
    return createBeneficiaryTypeCache(subsides)
  }, [subsides])

  // Top Bénéficiaires Globaux (toutes catégories confondues)
  // Utilise le regroupement dynamique (normalisation + BCE) pour éviter la fragmentation
  // Permet de choisir le nombre (10, 20, 30, 40, 50) et de filtrer par montant minimum
  const topGlobalBeneficiaries = useMemo(() => {
    // Étape 1 : Regrouper les bénéficiaires de manière dynamique
    const beneficiaryGroups = groupBeneficiaries(subsides)
    
    // Étape 2 : Agréger par groupe avec les catégories
    const beneficiaryMap = new Map<string, { name: string; totalAmount: number; count: number; categories: Map<string, number>; originalNames: Set<string> }>()
    
    subsides.forEach((subside) => {
      // Trouver le groupe auquel appartient ce bénéficiaire
      let groupKey: string | null = null
      let displayName = subside.beneficiaire_begunstigde
      
      for (const [key, group] of beneficiaryGroups.entries()) {
        if (group.originalNames.has(subside.beneficiaire_begunstigde)) {
          groupKey = key
          displayName = group.displayName
          break
        }
      }
      
      // Si pas de groupe trouvé (cas rare), utiliser la normalisation comme clé
      if (!groupKey) {
        groupKey = `norm:${normalizeBeneficiaryNameDynamic(subside.beneficiaire_begunstigde)}`
        displayName = subside.beneficiaire_begunstigde
      }
      
      const category = categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)
      const amount = subside.montant_octroye_toegekend_bedrag
      
      const existing = beneficiaryMap.get(groupKey) || {
        name: displayName,
        totalAmount: 0,
        count: 0,
        categories: new Map<string, number>(),
        originalNames: new Set<string>(),
      }
      
      existing.totalAmount += amount
      existing.count += 1
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      
      // Mettre à jour le nom d'affichage si on trouve un meilleur (plus court ou depuis le groupe)
      const group = beneficiaryGroups.get(groupKey)
      if (group && group.displayName.length < existing.name.length) {
        existing.name = group.displayName
      }
      
      const catAmount = existing.categories.get(category) || 0
      existing.categories.set(category, catAmount + amount)
      
      beneficiaryMap.set(groupKey, existing)
    })
    
    const result = Array.from(beneficiaryMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        topCategory: Array.from(item.categories.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A',
        topCategoryAmount: Array.from(item.categories.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[1] || 0,
      }))
    
    // Limiter au nombre sélectionné
    return result.slice(0, topBeneficiariesCount)
  }, [subsides, topBeneficiariesCount])

  // Préparer les données pour le graphique : Top 10 + "Autres" pour améliorer la lisibilité
  const chartData = useMemo(() => {
    const top10 = topGlobalBeneficiaries.slice(0, 10)
    const others = topGlobalBeneficiaries.slice(10)
    
    if (others.length === 0) {
      // Si moins de 10 bénéficiaires, afficher tous
      return topGlobalBeneficiaries
    }
    
    // Calculer le total des "Autres"
    const othersTotal = others.reduce((sum, b) => sum + b.totalAmount, 0)
    const othersCount = others.length
    
    // Créer la barre "Autres"
    const othersBar = {
      name: `Autres (${othersCount} bénéficiaire${othersCount > 1 ? 's' : ''})`,
      totalAmount: othersTotal,
      count: othersCount,
      rank: 11,
      topCategory: 'N/A',
      topCategoryAmount: 0,
      categories: new Map<string, number>(),
      originalNames: new Set<string>(),
    }
    
    return [...top10, othersBar]
  }, [topGlobalBeneficiaries])

  // Top Bénéficiaires par Catégorie
  // Pour chaque catégorie de subside, trouve les bénéficiaires qui reçoivent le plus
  const topBeneficiariesByCategory = useMemo(() => {
    const categoryMap = new Map<string, Map<string, { name: string; totalAmount: number; count: number; originalNames: Set<string> }>>()
    
    subsides.forEach((subside) => {
      const category = categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)
      const beneficiaryType = getBeneficiaryType(subside.beneficiaire_begunstigde, beneficiaryTypeCache)
      const amount = subside.montant_octroye_toegekend_bedrag
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map())
      }
      
      const beneficiaryMap = categoryMap.get(category)!
      const existing = beneficiaryMap.get(beneficiaryType) || {
        name: beneficiaryType,
        totalAmount: 0,
        count: 0,
        originalNames: new Set<string>(),
      }
      
      existing.totalAmount += amount
      existing.count += 1
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      
      beneficiaryMap.set(beneficiaryType, existing)
    })
    
    // Pour chaque catégorie, prendre les top 5 bénéficiaires
    const result: Array<{ category: string; beneficiaries: Array<{ name: string; totalAmount: number; count: number; rank: number; originalNames: Set<string> }> }> = []
    
    categoryMap.forEach((beneficiaryMap, category) => {
      const beneficiaries = Array.from(beneficiaryMap.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }))
      
      if (beneficiaries.length > 0) {
        result.push({ category, beneficiaries })
      }
    })
    
    // Filtrer les catégories indésirables
    const excludedCategories = [
      'Fonctionnement', 
      'Social', 
      'Autre', 
      'Arts Visuels',
      'Quartier et Urbanisme',
      'Éducation',
      'Santé',
      'Environnement',
      'Danse'
    ]
    const filteredResult = result.filter(item => !excludedCategories.includes(item.category))
    
    // Trier par montant total de la catégorie (somme des top 5)
    return filteredResult.sort((a, b) => {
      const totalA = a.beneficiaries.reduce((sum, b) => sum + b.totalAmount, 0)
      const totalB = b.beneficiaries.reduce((sum, b) => sum + b.totalAmount, 0)
      return totalB - totalA
    })
  }, [subsides, beneficiaryTypeCache])


  // Calcul des données de comparaison entre années
  const yearComparisonData = useMemo(() => {
    const yearMap = new Map<string, {
      year: string
      totalOctroye: number
      totalPrevu: number
      count: number
      categories: Map<string, number>
    }>()

    subsides.forEach((subside) => {
      const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
      if (!year || year === 'Non spécifié') return

      const existing = yearMap.get(year) || {
        year,
        totalOctroye: 0,
        totalPrevu: 0,
        count: 0,
        categories: new Map<string, number>(),
      }

      existing.totalOctroye += subside.montant_octroye_toegekend_bedrag
      existing.totalPrevu += subside.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023
      existing.count += 1

      const category = categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)
      if (category) {
        const current = existing.categories.get(category) || 0
        existing.categories.set(category, current + subside.montant_octroye_toegekend_bedrag)
      }

      yearMap.set(year, existing)
    })

    const sortedYears = Array.from(yearMap.values())
      .sort((a, b) => Number.parseInt(a.year) - Number.parseInt(b.year))

    return sortedYears.map((data, index) => {
      const previousYear = index > 0 ? sortedYears[index - 1] : null
      const variation = previousYear
        ? ((data.totalOctroye - previousYear.totalOctroye) / previousYear.totalOctroye) * 100
        : 0

      let topCategory = 'N/A'
      let topCategoryValue = 0
      data.categories.forEach((value, category) => {
        if (value > topCategoryValue) {
          topCategoryValue = value
          topCategory = category
        }
      })

      return {
        year: data.year,
        totalOctroye: data.totalOctroye,
        totalPrevu: data.totalPrevu,
        count: data.count,
        average: data.count > 0 ? data.totalOctroye / data.count : 0,
        variation,
        trend: variation > 5 ? 'up' : variation < -5 ? 'down' : 'stable',
        topCategory,
      }
    })
  }, [subsides])

  // Données pour le graphique en ligne (évolution temporelle)
  const evolutionLineData = useMemo(() => {
    let dataToUse = yearComparisonData

    if (comparisonCategoryFilter !== 'all') {
      dataToUse = yearComparisonData.map((yearData) => {
        const categorySubsides = subsides.filter((s) => {
          const year = s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
          const category = categorizeSubside(s.l_objet_de_la_subvention_doel_van_de_subsidie)
          return year === yearData.year && category === comparisonCategoryFilter
        })

        const totalOctroye = categorySubsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
        const totalPrevu = categorySubsides.reduce((sum, s) => sum + s.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023, 0)

        return {
          ...yearData,
          totalOctroye,
          totalPrevu,
        }
      })
    }

    return dataToUse.map((data) => ({
      year: data.year,
      'Montant octroyé': data.totalOctroye,
      'Montant prévu': data.totalPrevu,
      count: data.count,
      average: data.average,
    }))
  }, [yearComparisonData, comparisonCategoryFilter, subsides])

  // Données pour le graphique par catégories (barres groupées)
  const categoryComparisonData = useMemo(() => {
    const categoryMap = new Map<string, Map<string, number>>()

    subsides.forEach((subside) => {
      const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
      const category = categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)
      
      if (!year || year === 'Non spécifié' || !category) return

      if (selectedComparisonYears.length > 0 && !selectedComparisonYears.includes(year)) {
        return
      }

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map<string, number>())
      }

      const yearMap = categoryMap.get(category)!
      const current = yearMap.get(year) || 0
      yearMap.set(year, current + subside.montant_octroye_toegekend_bedrag)
    })

    const allYears = selectedComparisonYears.length > 0
      ? selectedComparisonYears.sort((a, b) => Number.parseInt(a) - Number.parseInt(b))
      : [...new Set(subsides.map(s => s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend).filter(y => y && y !== 'Non spécifié'))]
          .sort((a, b) => Number.parseInt(a) - Number.parseInt(b))

    const result: Array<{ category: string; [year: string]: number | string }> = []

    categoryMap.forEach((yearMap, category) => {
      const entry: { category: string; [year: string]: number | string } = { category }
      allYears.forEach((year) => {
        entry[year] = yearMap.get(year) || 0
      })
      result.push(entry)
    })

    return result
  }, [subsides, selectedComparisonYears])

  // Fonction helper pour trouver les subsides d'une organisation
  // AMÉLIORÉE : Retourne TOUS les subsides correspondants, IGNORE les BCE (non fiables)
  // Priorité : Nom normalisé > Recherche exacte > Recherche partielle
  const findOrgSubsides = useCallback((orgName: string): Subside[] => {
    const normalizedSearch = normalizeBeneficiaryNameDynamic(orgName)
    const searchLower = orgName.toLowerCase().trim()
    
    // 1. Recherche par nom normalisé (IGNORE les BCE, regroupe tous les subsides avec le même nom normalisé)
    // C'est la méthode la plus fiable car les BCE peuvent être incorrects
    const allMatchesByNormalizedName = new Set<Subside>()
    
    subsides.forEach(s => {
      if (!s.beneficiaire_begunstigde) return
      
      const beneficiaryNormalized = normalizeBeneficiaryNameDynamic(s.beneficiaire_begunstigde)
      
      // Si le nom normalisé correspond exactement, c'est un match
      if (beneficiaryNormalized === normalizedSearch && normalizedSearch !== '') {
        allMatchesByNormalizedName.add(s)
      }
    })
    
    if (allMatchesByNormalizedName.size > 0) {
      const result = Array.from(allMatchesByNormalizedName)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[findOrgSubsides] "${orgName}" trouvé via nom normalisé (IGNORE BCE):`, {
          count: result.length,
          totalAmount: result.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0),
          years: [...new Set(result.map(s => s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend))],
          bces: [...new Set(result.map(s => s.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie).filter(Boolean))]
        })
      }
      return result
    }
    
    // 2. Recherche exacte par nom (fallback)
    const exactMatches = subsides.filter(s => s.beneficiaire_begunstigde === orgName)
    if (exactMatches.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[findOrgSubsides] "${orgName}" trouvé via recherche exacte:`, {
          count: exactMatches.length,
          totalAmount: exactMatches.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
        })
      }
      return exactMatches
    }
    
    // 3. Recherche partielle (case-insensitive) - RETOURNE TOUS LES MATCHES
    const allMatches = new Set<Subside>()
    const matchedNames = new Set<string>()
    
    subsides.forEach(s => {
      if (!s.beneficiaire_begunstigde) return
      
      const beneficiaryLower = s.beneficiaire_begunstigde.toLowerCase()
      const beneficiaryNormalized = normalizeBeneficiaryNameDynamic(s.beneficiaire_begunstigde)
      
      // Match si le nom contient la recherche OU si la normalisation contient la recherche normalisée
      if (beneficiaryLower.includes(searchLower) || 
          (normalizedSearch && beneficiaryNormalized.includes(normalizedSearch))) {
        allMatches.add(s)
        matchedNames.add(s.beneficiaire_begunstigde)
      }
    })
    
    // Si on trouve des matches, les retourner tous
    if (allMatches.size > 0) {
      const result = Array.from(allMatches)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[findOrgSubsides] "${orgName}" trouvé via recherche partielle:`, {
          count: result.length,
          totalAmount: result.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0),
          matchedNames: Array.from(matchedNames),
          searchLower,
          normalizedSearch
        })
      }
      return result
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[findOrgSubsides] "${orgName}" non trouvé`)
    }
    return []
  }, [subsides])

  // Liste des organisations disponibles (pour l'autocomplete)
  // AMÉLIORÉE : Regroupe par nom normalisé (IGNORE les BCE non fiables)
  const availableOrganizations = useMemo(() => {
    // Créer un Map par nom normalisé (pas par BCE)
    const orgMap = new Map<string, {
      displayName: string
      originalNames: string[]
      totalAmount: number
      count: number
      allSearchableNames: string[]
    }>()
    
    // Regrouper par nom normalisé (ignore les BCE)
    const normalizedMap = new Map<string, {
      displayName: string
      originalNames: Set<string>
      subsides: Subside[]
    }>()
    
    subsides.forEach(subside => {
      const beneficiaryName = subside.beneficiaire_begunstigde
      if (!beneficiaryName || !beneficiaryName.trim()) return
      
      const normalized = normalizeBeneficiaryNameDynamic(beneficiaryName)
      if (!normalized) return
      
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, {
          displayName: beneficiaryName, // Premier nom trouvé
          originalNames: new Set([beneficiaryName]),
          subsides: [subside]
        })
      } else {
        const group = normalizedMap.get(normalized)!
        group.originalNames.add(beneficiaryName)
        group.subsides.push(subside)
        // Utiliser le nom le plus court comme displayName
        if (beneficiaryName.length < group.displayName.length) {
          group.displayName = beneficiaryName
        }
      }
    })
    
    // Convertir en format pour l'autocomplete
    normalizedMap.forEach((group) => {
      const allNames = Array.from(group.originalNames)
      const totalAmount = group.subsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
      
      orgMap.set(group.displayName, {
        displayName: group.displayName,
        originalNames: allNames,
        totalAmount,
        count: group.subsides.length,
        allSearchableNames: allNames
      })
    })
    
    return Array.from(orgMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }, [subsides])

  // Fonction helper pour recherche multi-mots-clés
  const matchesMultiKeywordSearch = useCallback((searchText: string, org: typeof availableOrganizations[0]): boolean => {
    if (!searchText.trim()) return true
    
    const searchLower = searchText.toLowerCase().trim()
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0)
    
    const allSearchTexts = [
      org.displayName,
      ...org.allSearchableNames
    ].map(name => ({
      original: name.toLowerCase(),
      normalized: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
    }))
    
    if (searchWords.length === 1) {
      const singleWord = searchWords[0]
      const normalizedWord = singleWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
      
      for (const text of allSearchTexts) {
        if (text.original.includes(singleWord) || text.normalized.includes(normalizedWord)) {
          return true
        }
      }
      return false
    }
    
    const allNamesTextOriginal = allSearchTexts.map(t => t.original).join(' ')
    const allNamesTextNormalized = allSearchTexts.map(t => t.normalized).join(' ')
    
    return searchWords.every(word => {
      const normalizedWord = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ')
      return allNamesTextOriginal.includes(word) || allNamesTextNormalized.includes(normalizedWord)
    })
  }, [])

  // Filtre les organisations pour l'autocomplete
  const filteredOrgs1 = useMemo(() => {
    if (!orgSearch1) return availableOrganizations.slice(0, 15)
    return availableOrganizations
      .filter(org => matchesMultiKeywordSearch(orgSearch1, org))
      .filter(org => !selectedOrg1.includes(org.displayName)) // Exclure celles déjà sélectionnées
      .slice(0, 15)
  }, [availableOrganizations, orgSearch1, selectedOrg1, matchesMultiKeywordSearch])

  const filteredOrgs2 = useMemo(() => {
    if (!orgSearch2) return availableOrganizations.slice(0, 15)
    return availableOrganizations
      .filter(org => matchesMultiKeywordSearch(orgSearch2, org))
      .filter(org => !selectedOrg2.includes(org.displayName)) // Exclure celles déjà sélectionnées
      .slice(0, 15)
  }, [availableOrganizations, orgSearch2, selectedOrg2, matchesMultiKeywordSearch])

  // Calcul des données pour l'organisation 1 (peut être plusieurs organisations)
  const org1Data = useMemo(() => {
    if (!selectedOrg1 || selectedOrg1.length === 0) return null

    const allOrgSubsides: Subside[] = []
    const allOriginalNames = new Set<string>()
    const orgNames: string[] = []

    selectedOrg1.forEach(orgName => {
      const orgSubsides = findOrgSubsides(orgName)
      allOrgSubsides.push(...orgSubsides)
      orgSubsides.forEach(s => allOriginalNames.add(s.beneficiaire_begunstigde))
      orgNames.push(orgName)
    })

    if (allOrgSubsides.length === 0) return null

    // Fonction helper pour normaliser l'année (extraire YYYY d'un format quelconque)
    const normalizeYear = (yearValue: string | null | undefined): string | null => {
      if (!yearValue) return null
      const yearStr = String(yearValue).trim()
      // Extraire les 4 premiers chiffres (format YYYY)
      const yearMatch = yearStr.match(/^(\d{4})/)
      return yearMatch ? yearMatch[1] : null
    }

    const allYears = ['2019', '2020', '2021', '2022', '2023', '2024']
    const yearData = allYears.map(year => {
      const yearSubsides = allOrgSubsides.filter(s => {
        const subsideYear = normalizeYear(s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
        return subsideYear === year
      })
      const amount = yearSubsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
      return {
        year,
        'Montant octroyé': amount,
        count: yearSubsides.length,
        average: yearSubsides.length > 0 ? amount / yearSubsides.length : 0
      }
    })

    const totalAmount = yearData.reduce((sum, d) => sum + d['Montant octroyé'], 0)

    return {
      name: orgNames.length === 1 ? orgNames[0] : `${orgNames[0]}...`,
      originalNames: Array.from(allOriginalNames),
      totalAmount,
      yearData,
      orgNames
    }
  }, [selectedOrg1, findOrgSubsides])

  // Calcul des données pour l'organisation 2 (peut être plusieurs organisations)
  const org2Data = useMemo(() => {
    if (!selectedOrg2 || selectedOrg2.length === 0) return null

    const allOrgSubsides: Subside[] = []
    const allOriginalNames = new Set<string>()
    const orgNames: string[] = []

    selectedOrg2.forEach(orgName => {
      const orgSubsides = findOrgSubsides(orgName)
      allOrgSubsides.push(...orgSubsides)
      orgSubsides.forEach(s => allOriginalNames.add(s.beneficiaire_begunstigde))
      orgNames.push(orgName)
    })

    if (allOrgSubsides.length === 0) return null

    // Fonction helper pour normaliser l'année (extraire YYYY d'un format quelconque)
    const normalizeYear = (yearValue: string | null | undefined): string | null => {
      if (!yearValue) return null
      const yearStr = String(yearValue).trim()
      // Extraire les 4 premiers chiffres (format YYYY)
      const yearMatch = yearStr.match(/^(\d{4})/)
      return yearMatch ? yearMatch[1] : null
    }

    const allYears = ['2019', '2020', '2021', '2022', '2023', '2024']
    const yearData = allYears.map(year => {
      const yearSubsides = allOrgSubsides.filter(s => {
        const subsideYear = normalizeYear(s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
        return subsideYear === year
      })
      const amount = yearSubsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
      return {
        year,
        'Montant octroyé': amount,
        count: yearSubsides.length,
        average: yearSubsides.length > 0 ? amount / yearSubsides.length : 0
      }
    })

    const totalAmount = yearData.reduce((sum, d) => sum + d['Montant octroyé'], 0)

    return {
      name: orgNames.length === 1 ? orgNames[0] : `${orgNames[0]}...`,
      originalNames: Array.from(allOriginalNames),
      totalAmount,
      yearData,
      orgNames
    }
  }, [selectedOrg2, findOrgSubsides])

  // Métriques comparatives
  const comparisonMetrics = useMemo(() => {
    if (!org1Data || !org2Data) return null

    const totalDifference = org2Data.totalAmount - org1Data.totalAmount
    const absDifference = Math.abs(totalDifference)
    
    // Calculer le pourcentage de différence de manière plus intuitive
    // On compare toujours par rapport à la plus petite valeur pour avoir un pourcentage cohérent
    const smallerAmount = Math.min(org1Data.totalAmount, org2Data.totalAmount)
    const largerAmount = Math.max(org1Data.totalAmount, org2Data.totalAmount)
    
    let totalPercentageDiff = 0
    let ratio = 1
    let useRatio = false
    
    if (smallerAmount > 0) {
      const percentageDiff = ((largerAmount - smallerAmount) / smallerAmount) * 100
      // Si la différence est très grande (>1000%), utiliser plutôt un ratio (ex: "5x plus")
      if (percentageDiff > 1000) {
        ratio = largerAmount / smallerAmount
        useRatio = true
        totalPercentageDiff = percentageDiff // Garder pour l'affichage si nécessaire
      } else {
        totalPercentageDiff = percentageDiff
      }
    } else if (largerAmount > 0) {
      // Si une organisation a 0 et l'autre a quelque chose
      totalPercentageDiff = 100
    }
    
    // Déterminer quelle organisation reçoit plus
    const org2ReceivesMore = org2Data.totalAmount > org1Data.totalAmount
    const org1ReceivesMore = org1Data.totalAmount > org2Data.totalAmount

    // Calculer la moyenne par an pour chaque groupe (nombre d'années avec des subsides)
    const org1Years = org1Data.yearData.filter(d => d['Montant octroyé'] > 0).length
    const org2Years = org2Data.yearData.filter(d => d['Montant octroyé'] > 0).length
    const org1AvgPerYear = org1Years > 0 ? org1Data.totalAmount / org1Years : 0
    const org2AvgPerYear = org2Years > 0 ? org2Data.totalAmount / org2Years : 0

    return {
      totalDifference,
      absDifference,
      totalPercentageDiff,
      ratio,
      useRatio,
      org2ReceivesMore,
      org1ReceivesMore,
      org1Total: org1Data.totalAmount,
      org2Total: org2Data.totalAmount,
      org1AvgPerYear,
      org2AvgPerYear
    }
  }, [org1Data, org2Data])

  // Calculer les stats pour le header (avant les early returns)
  const totalAmount = useMemo(() => {
    return subsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  }, [subsides])

  const totalSubsides = subsides.length

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadData(selectedDataYear)} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <AppHeader
          totalAmount={totalAmount}
          totalSubsides={totalSubsides}
          selectedYear={selectedDataYear}
          currentPage="analyse"
          showStats={true}
          showNavigation={true}
        />

        {/* Sous-onglets pour les graphiques */}
        <Tabs defaultValue="comparison" className="space-y-4 sm:space-y-6">
          <div className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1 sm:p-1.5">
            <TabsList className="grid grid-cols-3 w-full h-auto gap-1 bg-transparent p-0 border-0">
              <TabsTrigger 
                value="comparison"
                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 text-gray-700 transition-all text-xs sm:text-sm font-medium py-2 sm:py-2.5 px-2 sm:px-3 flex items-center justify-center min-h-[44px] sm:min-h-0 whitespace-normal break-words border-0"
              >
                Comparaison
              </TabsTrigger>
              <TabsTrigger 
                value="by-category" 
                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 text-gray-700 transition-all text-xs sm:text-sm font-medium py-2 sm:py-2.5 px-2 sm:px-3 flex items-center justify-center min-h-[44px] sm:min-h-0 whitespace-normal break-words border-0"
              >
                Par catégorie
              </TabsTrigger>
              <TabsTrigger 
                value="top-beneficiaries" 
                className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 text-gray-700 transition-all text-xs sm:text-sm font-medium py-2 sm:py-2.5 px-2 sm:px-3 flex items-center justify-center min-h-[44px] sm:min-h-0 whitespace-normal break-words border-0"
              >
                Top Bénéficiaires
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Nouvel onglet Top Bénéficiaires */}
          <TabsContent value="top-beneficiaries" className="space-y-6">
            {/* Top Bénéficiaires Globaux */}
            {loading ? (
              <ChartSkeleton height={500} />
            ) : (
              <>
                <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                  <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">
                          Top 10 Bénéficiaires Globaux
                          {topGlobalBeneficiaries.length > 10 && (
                            <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1.5">
                              (Top 10 + {topGlobalBeneficiaries.length - 10} autres)
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                          Les bénéficiaires qui reçoivent le plus (toutes catégories confondues)
                          {topGlobalBeneficiaries.length > 10 && ' • Affichage optimisé : Top 10 + regroupement des autres'}
                        </CardDescription>
                      </div>
                      {/* Sélecteur de type de graphique */}
                      <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                        <Button
                          variant={top10ChartType === 'pie' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTop10ChartType('pie')}
                          className="h-8 px-2.5 sm:px-3 text-xs font-medium"
                        >
                          <PieChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Camembert</span>
                          <span className="sm:hidden">Pie</span>
                        </Button>
                        <Button
                          variant={top10ChartType === 'list' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTop10ChartType('list')}
                          className="h-8 px-2.5 sm:px-3 text-xs font-medium"
                        >
                          Liste
                        </Button>
                        <Button
                          variant={top10ChartType === 'bar' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setTop10ChartType('bar')}
                          className="h-8 px-2.5 sm:px-3 text-xs font-medium"
                        >
                          Barres
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {top10ChartType === 'pie' && (
                      <div className="space-y-4">
                        <Top10PieChart
                          data={chartData}
                          colors={COLORS}
                          onSliceClick={handleBarClick}
                        />
                      </div>
                    )}
                    {top10ChartType === 'list' && (
                      <Top10ListChart
                        data={chartData}
                        colors={COLORS}
                        onItemClick={handleBarClick}
                      />
                    )}
                    {top10ChartType === 'bar' && (
                      <NivoBarChart 
                        data={chartData} 
                        colors={COLORS}
                        padding={0.5}
                        leftMargin={250}
                        onBarClick={handleBarClick}
                      />
                    )}
                  </CardContent>
                </Card>
                {/* Légende séparée pour le camembert */}
                {top10ChartType === 'pie' && !loading && (
                  <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm mt-4">
                    <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">
                        Légende
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <PieChartLegend
                        data={chartData.map((item, index) => ({
                          name: item.name,
                          color: COLORS[index % COLORS.length],
                          rank: item.rank,
                          totalAmount: item.totalAmount,
                        }))}
                        onItemClick={(item) => {
                          handleBarClick({
                            name: item.name,
                            value: item.totalAmount,
                            rank: item.rank,
                          })
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}

          </TabsContent>

          <TabsContent value="by-category" className="space-y-6">
            <div className="space-y-6">
              {loading ? (
                <ChartSkeleton height={400} />
              ) : (
                topBeneficiariesByCategory.map((categoryData) => (
                  <Card key={categoryData.category} className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                    <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">{categoryData.category}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                        Top bénéficiaires dans cette catégorie
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <NivoBarChart 
                            data={categoryData.beneficiaries} 
                        colors={COLORS}
                        height={400}
                        leftMargin={200}
                        padding={0.6}
                        onBarClick={handleBarClick}
                        totalForPercentage={categoryData.beneficiaries.reduce((sum, b) => sum + b.totalAmount, 0)}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="years">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">Évolution des montants par année</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      value: {
                        label: "Montant",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-[300px] sm:h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearData} margin={{ 
                        top: responsiveProps.topMargin, 
                        right: responsiveProps.rightMargin, 
                        left: responsiveProps.leftMargin, 
                        bottom: responsiveProps.bottomMargin 
                      }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                        />
                        <YAxis 
                          tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                          tickFormatter={(value) => {
                            if (value >= 1000000) {
                              return `${Math.round(value / 1000000)}M`
                            } else if (value >= 1000) {
                              return `${Math.round(value / 1000)}K`
                            } else {
                              return `${Math.round(value)}`
                            }
                          }}
                        />
                        <Tooltip 
                          content={<CustomTooltip 
                          formatter={(value) => [`${Number(value).toLocaleString()} €`, "Montant"]}
                          />}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">Nombre de subsides par année</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: "Nombre",
                        color: "hsl(var(--chart-5))",
                      },
                    }}
                    className="h-[300px] sm:h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearData} margin={{ 
                        top: responsiveProps.topMargin, 
                        right: responsiveProps.rightMargin, 
                        left: responsiveProps.leftMargin, 
                        bottom: responsiveProps.bottomMargin 
                      }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                        />
                        <YAxis 
                          tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip 
                          content={<CustomTooltip 
                          formatter={(value) => [`${Number(value).toLocaleString()} subsides`, "Nombre"]}
                          />}
                        />
                        <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Comparaison */}
          <TabsContent value="comparison" className="space-y-6">
            {/* Sous-onglets pour Comparaison */}
            <div className="flex gap-3 border-b border-gray-200 pb-3 justify-center">
              <Button
                variant={comparisonView === "organizations" ? "default" : "outline"}
                onClick={() => setComparisonView("organizations")}
                className={`${
                  comparisonView === "organizations"
                    ? "bg-pink-200 text-pink-600 hover:bg-pink-300 border-2 border-pink-300 shadow-md font-normal"
                    : "text-gray-700 hover:text-gray-900 hover:bg-pink-50 border-2 border-gray-300 hover:border-pink-300 bg-white"
                } transition-all duration-200 px-6 py-2.5 rounded-lg`}
              >
                Comparaison entre Organisations
              </Button>
              <Button
                variant={comparisonView === "global" ? "default" : "outline"}
                onClick={() => setComparisonView("global")}
                className={`${
                  comparisonView === "global"
                    ? "bg-pink-200 text-pink-600 hover:bg-pink-300 border-2 border-pink-300 shadow-md font-normal"
                    : "text-gray-700 hover:text-gray-900 hover:bg-pink-50 border-2 border-gray-300 hover:border-pink-300 bg-white"
                } transition-all duration-200 px-6 py-2.5 rounded-lg`}
              >
                Global
              </Button>
            </div>

            {/* Comparaison entre Organisations */}
            {comparisonView === "organizations" && (
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">Comparaison entre Organisations</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                      Sélectionnez une ou plusieurs organisations pour chaque groupe à comparer
                    </CardDescription>
                  </div>
                  {showComparison && (
                    <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                      <Button
                        onClick={() => {
                          setSelectedOrg1([])
                          setSelectedOrg2([])
                          setOrgSearch1("")
                          setOrgSearch2("")
                        }}
                        variant="outline"
                        className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 hover:border-gray-400 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-normal shadow-sm transition-all duration-200 text-sm"
                      >
                        Nouvelle recherche
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pt-4 pb-0">
                {/* Sélection des organisations */}
                <Card className="bg-transparent border-0 shadow-none p-0">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Groupe 1 */}
                      <div className="space-y-1.5 min-h-[180px] flex flex-col">
                        {/* Tags des organisations sélectionnées */}
                        <div className="min-h-[30px] flex flex-wrap gap-1 mb-1">
                          {selectedOrg1.length > 0 && (
                            selectedOrg1.map((orgName) => (
                              <div
                                key={orgName}
                                className="flex items-center gap-0.5 text-green-700 px-1 py-0 text-[9px] font-medium border border-green-300 rounded"
                              >
                                <span className="max-w-[80px] truncate" title={orgName}>
                                  {orgName.length > 12 ? `${orgName.substring(0, 12)}...` : orgName}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedOrg1(selectedOrg1.filter(name => name !== orgName))
                                  }}
                                  className="hover:text-green-900 rounded p-0 transition-colors"
                                  aria-label={`Retirer ${orgName}`}
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="relative group flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 z-10 transition-colors duration-200 group-focus-within:text-green-700" />
                      <Input
                        placeholder="Rechercher une organisation..."
                        value={orgSearch1}
                        onChange={(e) => {
                          setOrgSearch1(e.target.value)
                        }}
                        className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 text-sm border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 rounded-lg bg-green-50/50 focus:bg-white transition-all duration-200 shadow-sm focus:shadow-lg w-full"
                        style={{ caretColor: '#10B981' }}
                      />
                      {orgSearch1 && (
                        <button
                          onClick={() => {
                            setOrgSearch1("")
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-400 hover:text-green-600 transition-colors duration-200 z-10"
                          aria-label="Effacer la recherche"
                        >
                          <X className="h-full w-full" />
                        </button>
                      )}
                      {orgSearch1 && filteredOrgs1.length > 0 && (
                        <div className="absolute z-10 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-auto">
                          {filteredOrgs1.map((org) => (
                            <button
                              key={org.displayName}
                              onClick={() => {
                                if (!selectedOrg1.includes(org.displayName)) {
                                  setSelectedOrg1([...selectedOrg1, org.displayName])
                                  setOrgSearch1("")
                                }
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900 text-sm">{org.displayName}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {org.totalAmount.toLocaleString()}&nbsp;€ • {org.count} subsides
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Groupe 2 */}
                  <div className="space-y-1.5 min-h-[180px] flex flex-col">
                    {/* Tags des organisations sélectionnées */}
                    <div className="min-h-[30px] flex flex-wrap gap-1 mb-1">
                      {selectedOrg2.length > 0 && (
                        selectedOrg2.map((orgName) => (
                          <div
                            key={orgName}
                            className="flex items-center gap-0.5 text-pink-700 px-1 py-0 text-[9px] font-medium border border-pink-300 rounded"
                          >
                            <span className="max-w-[80px] truncate" title={orgName}>
                              {orgName.length > 12 ? `${orgName.substring(0, 12)}...` : orgName}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedOrg2(selectedOrg2.filter(name => name !== orgName))
                              }}
                              className="hover:text-pink-900 rounded p-0 transition-colors"
                              aria-label={`Retirer ${orgName}`}
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="relative group flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-pink-600 z-10 transition-colors duration-200 group-focus-within:text-pink-700" />
                      <Input
                        placeholder="Rechercher une organisation..."
                        value={orgSearch2}
                        onChange={(e) => {
                          setOrgSearch2(e.target.value)
                        }}
                        className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 text-sm border-2 border-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 rounded-lg bg-pink-50/50 focus:bg-white transition-all duration-200 shadow-sm focus:shadow-lg w-full"
                        style={{ caretColor: '#EC4899' }}
                      />
                      {orgSearch2 && (
                        <button
                          onClick={() => {
                            setOrgSearch2("")
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-pink-400 hover:text-pink-600 transition-colors duration-200 z-10"
                          aria-label="Effacer la recherche"
                        >
                          <X className="h-full w-full" />
                        </button>
                      )}
                      {orgSearch2 && filteredOrgs2.length > 0 && (
                        <div className="absolute z-10 w-full bottom-full mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-auto">
                          {filteredOrgs2.map((org) => (
                            <button
                              key={org.displayName}
                              onClick={() => {
                                if (!selectedOrg2.includes(org.displayName)) {
                                  setSelectedOrg2([...selectedOrg2, org.displayName])
                                  setOrgSearch2("")
                                }
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="font-medium text-gray-900 text-sm">{org.displayName}</div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {org.totalAmount.toLocaleString()}&nbsp;€ • {org.count} subsides
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Graphique combiné (vue d'ensemble) */}
                {showComparison && org1Data && org2Data && (() => {
                  // Créer un tableau combiné avec toutes les années
                  const allYears = ['2019', '2020', '2021', '2022', '2023', '2024']
                  const combinedData = allYears.map(year => {
                    const org1YearData = org1Data.yearData.find(d => d.year === year)
                    const org2YearData = org2Data.yearData.find(d => d.year === year)
                    return {
                      year,
                      [org1Data.name]: org1YearData ? org1YearData['Montant octroyé'] : 0,
                      [org2Data.name]: org2YearData ? org2YearData['Montant octroyé'] : 0,
                      org1Count: org1YearData ? org1YearData.count : 0,
                      org2Count: org2YearData ? org2YearData.count : 0,
                    }
                  })

                  return (
                    <Card className="bg-white border border-gray-200 mt-2">
                      <CardHeader className="border-b border-gray-100 px-4 py-2">
                        <CardTitle className="text-sm font-semibold text-gray-800">Vue d&apos;ensemble - Comparaison</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ChartContainer
                          config={{
                            [org1Data.name]: {
                              label: org1Data.name,
                              color: "#10B981",
                            },
                            [org2Data.name]: {
                              label: org2Data.name,
                              color: "#EC4899",
                            },
                          }}
                          className="h-[250px] sm:h-[280px] min-h-[200px] w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <LineChart data={combinedData} margin={{ 
                              top: 10, 
                              right: 10, 
                              left: 0, 
                              bottom: 5 
                            }}>
                              <XAxis 
                                dataKey="year" 
                                tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                              />
                              <YAxis 
                                tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                                tickFormatter={(value) => {
                                  if (value >= 1000000) {
                                    return `${Math.round(value / 1000000)}M`
                                  } else if (value >= 1000) {
                                    return `${Math.round(value / 1000)}K`
                                  } else {
                                    return `${Math.round(value)}`
                                  }
                                }}
                              />
                              <Tooltip 
                                content={({ active, label }) => {
                                  if (!active || !label) return null
                                  
                                  const yearData = combinedData.find(d => d.year === label)
                                  if (!yearData) return null
                                  
                                  const org1Value = yearData[org1Data.name] as number || 0
                                  const org2Value = yearData[org2Data.name] as number || 0
                                  
                                  // Ne pas afficher si les deux valeurs sont à 0
                                  if (org1Value === 0 && org2Value === 0) return null
                                  
                                  const truncateName = (name: string) => {
                                    return name.length > 10 ? `${name.substring(0, 10)}...` : name
                                  }
                                  
                                  return (
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[150px]">
                                      <div className="text-[10px] font-medium text-gray-600 mb-1.5">
                                        {label}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                                            {truncateName(org1Data.name)}
                                          </span>
                                          <span className="text-[10px] font-semibold text-gray-900">
                                            {org1Value.toLocaleString('fr-BE')}&nbsp;€
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]"></span>
                                            {truncateName(org2Data.name)}
                                          </span>
                                          <span className="text-[10px] font-semibold text-gray-900">
                                            {org2Value.toLocaleString('fr-BE')}&nbsp;€
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey={org1Data.name} 
                                stroke="#10B981" 
                                strokeWidth={3}
                                dot={{ fill: '#10B981', r: 5 }}
                                activeDot={{ r: 8 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey={org2Data.name} 
                                stroke="#EC4899" 
                                strokeWidth={3}
                                dot={{ fill: '#EC4899', r: 5 }}
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  )
                })()}

                {/* Métriques comparatives */}
                {showComparison && comparisonMetrics && org1Data && org2Data && (() => {
                  const formatAmount = (amount: number): string => {
                    // Utiliser toLocaleString avec fr-BE pour les espaces comme séparateurs de milliers
                    // Exemple: 1731911655 → "1 731 911 655 €"
                    return `${Math.round(amount).toLocaleString('fr-BE', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })} €`
                  }
                  
                  // Fonction pour tronquer le nom si nécessaire
                  const truncateName = (name: string, maxLength: number = 15) => {
                    if (!name || typeof name !== 'string') return ''
                    if (name.length <= maxLength) return name
                    return name.substring(0, maxLength) + '...'
                  }
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4">
                      <Card className="bg-green-100 border-green-300">
                        <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center text-center min-h-[100px] sm:min-h-[110px]">
                          <div className="text-[10px] sm:text-xs text-green-700 font-medium mb-1 sm:mb-1.5 break-words px-1">
                            {truncateName(org1Data.name, 20)}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-green-800 leading-tight break-words px-1">
                            {formatAmount(comparisonMetrics.org1Total)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-green-600 mt-1 sm:mt-1.5">
                            <span className="hidden sm:inline">Moyenne/an: </span>
                            <span className="sm:hidden">Moy/an: </span>
                            {formatAmount(comparisonMetrics.org1AvgPerYear)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-pink-100 border-pink-300">
                        <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center text-center min-h-[100px] sm:min-h-[110px]">
                          <div className="text-[10px] sm:text-xs text-pink-700 font-medium mb-1 sm:mb-1.5 break-words px-1">
                            {truncateName(org2Data.name, 20)}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-pink-800 leading-tight break-words px-1">
                            {formatAmount(comparisonMetrics.org2Total)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-pink-600 mt-1 sm:mt-1.5">
                            <span className="hidden sm:inline">Moyenne/an: </span>
                            <span className="sm:hidden">Moy/an: </span>
                            {formatAmount(comparisonMetrics.org2AvgPerYear)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center text-center min-h-[100px] sm:min-h-[110px]">
                          <div className="text-[10px] sm:text-xs text-gray-600 font-medium mb-1 sm:mb-1.5">Différence absolue</div>
                          <div className={`text-xs sm:text-sm font-bold leading-tight break-words px-1 ${comparisonMetrics.totalDifference > 0 ? 'text-pink-700' : comparisonMetrics.totalDifference < 0 ? 'text-green-700' : 'text-gray-900'}`}>
                            {comparisonMetrics.totalDifference > 0 ? '+' : ''}
                            {formatAmount(comparisonMetrics.totalDifference)}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-gray-600 mt-1 sm:mt-1.5 px-1">
                            {comparisonMetrics.totalDifference > 0 
                              ? `${truncateName(org2Data.name, 15)} reçoit plus`
                              : comparisonMetrics.totalDifference < 0
                              ? `${truncateName(org1Data.name, 15)} reçoit plus`
                              : 'Montants identiques'}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gray-50 border-gray-200">
                        <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center text-center min-h-[100px] sm:min-h-[110px]">
                          <div className="text-[10px] sm:text-xs text-gray-600 font-medium mb-1 sm:mb-1.5">
                            Comparaison relative
                          </div>
                          {comparisonMetrics.useRatio ? (
                            <>
                              <div className="text-xs sm:text-sm font-bold leading-tight text-gray-900 px-1">
                                {comparisonMetrics.ratio.toFixed(1)}×
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-gray-600 mt-1 sm:mt-1.5 font-medium leading-relaxed px-1">
                                {comparisonMetrics.org2ReceivesMore ? (
                                  <span>
                                    <span className="text-pink-600 font-semibold">{truncateName(org2Data.name, 12)}</span>
                                    <span className="text-gray-600"> reçoit </span>
                                    <span className="text-gray-700 font-semibold">{comparisonMetrics.ratio.toFixed(1)}×</span>
                                    <span className="text-gray-600"> plus que </span>
                                    <span className="text-green-600 font-semibold">{truncateName(org1Data.name, 12)}</span>
                                  </span>
                                ) : (
                                  <span>
                                    <span className="text-green-600 font-semibold">{truncateName(org1Data.name, 12)}</span>
                                    <span className="text-gray-600"> reçoit </span>
                                    <span className="text-gray-700 font-semibold">{comparisonMetrics.ratio.toFixed(1)}×</span>
                                    <span className="text-gray-600"> plus que </span>
                                    <span className="text-pink-600 font-semibold">{truncateName(org2Data.name, 12)}</span>
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className={`text-xs sm:text-sm font-bold leading-tight ${comparisonMetrics.org2ReceivesMore ? 'text-pink-700' : comparisonMetrics.org1ReceivesMore ? 'text-green-700' : 'text-gray-700'}`}>
                                {comparisonMetrics.totalPercentageDiff > 0 ? '+' : ''}
                                {comparisonMetrics.totalPercentageDiff.toFixed(1)}%
                              </div>
                              <div className="text-[9px] sm:text-[10px] text-gray-600 mt-1 sm:mt-1.5 font-medium leading-relaxed px-1">
                                {comparisonMetrics.org2ReceivesMore ? (
                                  <span>
                                    <span className="text-pink-600 font-semibold">{truncateName(org2Data.name, 12)}</span>
                                    <span className="text-gray-600"> reçoit </span>
                                    <span className="text-gray-700 font-semibold">{comparisonMetrics.totalPercentageDiff.toFixed(1)}%</span>
                                    <span className="text-gray-600"> de plus que </span>
                                    <span className="text-green-600 font-semibold">{truncateName(org1Data.name, 12)}</span>
                                  </span>
                                ) : comparisonMetrics.org1ReceivesMore ? (
                                  <span>
                                    <span className="text-green-600 font-semibold">{truncateName(org1Data.name, 12)}</span>
                                    <span className="text-gray-600"> reçoit </span>
                                    <span className="text-gray-700 font-semibold">{Math.abs(comparisonMetrics.totalPercentageDiff).toFixed(1)}%</span>
                                    <span className="text-gray-600"> de plus que </span>
                                    <span className="text-pink-600 font-semibold">{truncateName(org2Data.name, 12)}</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-600">
                                    Les deux groupes ont reçu le même montant
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* Graphiques d'évolution temporelle séparés */}
                {showComparison && org1Data && org2Data && (
                  <div className="grid grid-cols-1 gap-6 mt-6">
                    {/* Graphique Groupe 1 */}
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="border-b border-green-300 px-4 py-3">
                        <CardTitle className="text-sm font-semibold text-green-800">{org1Data.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ChartContainer
                          config={{
                            'Montant octroyé': {
                              label: "Montant octroyé",
                              color: "#10B981",
                            },
                          }}
                          className="h-[250px] sm:h-[280px] min-h-[200px] w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <LineChart data={org1Data.yearData} margin={{ 
                              top: 10, 
                              right: 10, 
                              left: 0, 
                              bottom: 5 
                            }}>
                              <XAxis 
                                dataKey="year" 
                                tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                              />
                              <YAxis 
                                tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                                tickFormatter={(value) => {
                                  if (value >= 1000000) {
                                    return `${Math.round(value / 1000000)}M`
                                  } else if (value >= 1000) {
                                    return `${Math.round(value / 1000)}K`
                                  } else {
                                    return `${Math.round(value)}`
                                  }
                                }}
                              />
                              <Tooltip 
                                content={<CustomTooltip 
                                formatter={(value, name) => {
                                  return [
                                    `${Number(value).toLocaleString()} €`,
                                    name || ''
                                  ]
                                }}
                                labelFormatter={(label) => `Année ${label}`}
                                />}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="Montant octroyé" 
                                stroke="#10B981" 
                                strokeWidth={3}
                                dot={{ fill: '#10B981', r: 5 }}
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Graphique Groupe 2 */}
                    <Card className="bg-pink-50 border-pink-200">
                      <CardHeader className="border-b border-pink-300 px-4 py-3">
                        <CardTitle className="text-sm font-semibold text-pink-800">{org2Data.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ChartContainer
                          config={{
                            'Montant octroyé': {
                              label: "Montant octroyé",
                              color: "#EC4899",
                            },
                          }}
                          className="h-[250px] sm:h-[280px] min-h-[200px] w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <LineChart data={org2Data.yearData} margin={{ 
                              top: 10, 
                              right: 10, 
                              left: 0, 
                              bottom: 5 
                            }}>
                              <XAxis 
                                dataKey="year" 
                                tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                              />
                              <YAxis 
                                tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                                tickFormatter={(value) => {
                                  if (value >= 1000000) {
                                    return `${Math.round(value / 1000000)}M`
                                  } else if (value >= 1000) {
                                    return `${Math.round(value / 1000)}K`
                                  } else {
                                    return `${Math.round(value)}`
                                  }
                                }}
                              />
                              <Tooltip 
                                content={<CustomTooltip 
                                formatter={(value, name) => {
                                  return [
                                    `${Number(value).toLocaleString()} €`,
                                    name || ''
                                  ]
                                }}
                                labelFormatter={(label) => `Année ${label}`}
                                />}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="Montant octroyé" 
                                stroke="#EC4899" 
                                strokeWidth={3}
                                dot={{ fill: '#EC4899', r: 5 }}
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Vue Global (comparaison entre années) */}
            {comparisonView === "global" && (
            <div className="space-y-6">
            {/* Indicateurs de tendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {yearComparisonData.slice(-4).map((data, index) => {
                const previous = index > 0 ? yearComparisonData.slice(-4)[index - 1] : null
                const variation = previous ? ((data.totalOctroye - previous.totalOctroye) / previous.totalOctroye) * 100 : 0
                
                return (
                  <Card key={data.year} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Année {data.year}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-gray-900">
                          {(data.totalOctroye / 1000000).toFixed(1)}M€
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {variation !== 0 && (
                            <>
                              <span className={`font-semibold ${variation > 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {variation > 0 ? '↑' : '↓'} {Math.abs(variation).toFixed(1)}%
                              </span>
                              <span className="text-gray-500">vs {previous?.year}</span>
                            </>
                          )}
                          {variation === 0 && (
                            <span className="text-gray-500">Première année</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.count} subsides • Moyenne: {(data.average / 1000).toFixed(0)}K€
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Graphique d'évolution temporelle */}
            {loading ? (
              <ChartSkeleton height={400} />
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
                <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">Évolution temporelle des montants</CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">Comparaison des montants octroyés et prévus par année</CardDescription>
                    </div>
                    <Select value={comparisonCategoryFilter} onValueChange={setComparisonCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-48 h-8 sm:h-9 border-0 bg-white/90 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-lg text-xs sm:text-sm flex-shrink-0">
                        <SelectValue placeholder="Filtrer par catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {uniqueCategories.sort().map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      'Montant octroyé': {
                        label: "Montant octroyé",
                        color: "hsl(var(--chart-1))",
                      },
                      'Montant prévu': {
                        label: "Montant prévu",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px] sm:h-[350px] lg:h-[400px]"
                  >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionLineData} margin={{ 
                      top: responsiveProps.topMargin, 
                      right: responsiveProps.rightMargin, 
                      left: responsiveProps.leftMargin, 
                      bottom: responsiveProps.bottomMargin 
                    }}>
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                      />
                      <YAxis 
                        tick={{ fontSize: responsiveProps.tickFontSize, fill: '#6B7280' }}
                        tickFormatter={(value) => {
                          if (value >= 1000000) {
                            return `${Math.round(value / 1000000)}M`
                          } else if (value >= 1000) {
                            return `${Math.round(value / 1000)}K`
                          } else {
                            return `${Math.round(value)}`
                          }
                        }}
                      />
                      <Tooltip 
                        content={<CustomTooltip 
                        formatter={(value, name) => {
                          return [
                            `${Number(value).toLocaleString()} €`,
                            name === 'Montant octroyé' ? `Octroyé` : `Prévu`
                          ]
                        }}
                        labelFormatter={(label) => {
                          const yearData = evolutionLineData.find(d => d.year === label)
                          if (!yearData) return `Année ${label}`
                          return `Année ${label} • ${yearData.count} subsides • Moyenne: ${(yearData.average / 1000).toFixed(0)}K€`
                        }}
                        />}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Montant octroyé" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Montant prévu" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', r: 5 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            )}

            {/* Graphique par catégories (barres groupées) */}
            {loading ? (
              <ChartSkeleton height={400} />
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">Comparaison par catégories</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">Évolution des montants par catégorie entre les années</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 flex-shrink-0">
                    {yearComparisonData.map((yearData) => {
                      const isSelected = selectedComparisonYears.includes(yearData.year)
                      return (
                        <Button
                          key={yearData.year}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedComparisonYears(selectedComparisonYears.filter(y => y !== yearData.year))
                            } else {
                              setSelectedComparisonYears([...selectedComparisonYears, yearData.year])
                            }
                          }}
                          className="h-8 px-2.5 sm:px-3 text-xs font-medium"
                        >
                          {yearData.year}
                        </Button>
                      )
                    })}
                    {selectedComparisonYears.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedComparisonYears([])}
                        className="h-8 px-2.5 sm:px-3 text-xs font-medium"
                      >
                        Tout sélectionner
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <NivoBarChart 
                  data={categoryComparisonData
                    .slice(0, 10)
                    .map((item) => {
                      // Agréger les montants de toutes les années sélectionnées
                      const yearsToShow = selectedComparisonYears.length > 0 
                        ? selectedComparisonYears 
                        : yearComparisonData.map(d => d.year)
                      
                      const totalAmount = yearsToShow.reduce((sum, year) => {
                        const yearAmount = item[year] as number || 0
                        return sum + yearAmount
                      }, 0)
                      
                      return {
                        name: item.category as string,
                        totalAmount,
                      }
                    })
                    .filter(item => item.totalAmount > 0)
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                  }
                  colors={COLORS}
                  height={400}
                  leftMargin={200}
                  padding={0.6}
                  onBarClick={handleBarClick}
                />
              </CardContent>
            </Card>
            )}

            {/* Tableau comparatif */}
            {loading ? (
              <ChartSkeleton height={300} showHeader={true} />
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 leading-tight">Tableau comparatif</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">Indicateurs clés par année</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm sm:text-base">Année</th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm sm:text-base">Nombre</th>
                        <th className="text-right py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm sm:text-base">Total octroyé</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total prévu</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Moyenne</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Variation</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Top catégorie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearComparisonData.map((data, index) => (
                        <tr key={data.year} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-gray-900">{data.year}</td>
                          <td className="py-3 px-4 text-right text-gray-700">{data.count.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                            {(data.totalOctroye / 1000000).toFixed(2)}M€
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">
                            {(data.totalPrevu / 1000000).toFixed(2)}M€
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">
                            {(data.average / 1000).toFixed(0)}K€
                          </td>
                          <td className="py-3 px-4 text-right">
                            {index > 0 ? (
                              <span className={`font-semibold ${data.variation > 0 ? 'text-green-600' : data.variation < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {data.variation > 0 ? '↑' : data.variation < 0 ? '↓' : '→'} {Math.abs(data.variation).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-700">{data.topCategory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            )}
            </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer avec compteur de visite et radars */}
      <AppFooter />
    </div>
  )
}

