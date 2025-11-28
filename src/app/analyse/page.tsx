"use client"
import { LoadingScreen } from "@/components/LoadingScreen"
import { CustomTooltip } from "@/components/CustomTooltip"
import { NivoBarChart } from "@/components/NivoBarChart"
import { Top10PieChart } from "@/components/Top10PieChart"
import { Top10ListChart } from "@/components/Top10ListChart"
import { ChartSkeleton } from "@/components/ChartSkeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Heart, PieChart as PieChartIcon, RefreshCw, Search } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bar, BarChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { Subside } from '@/lib/types'
import { normalizeSubsidesArray } from '@/lib/data-normalizer'
import { getCachedData, setCachedData } from '@/lib/cache'
import { groupBeneficiaries, normalizeBeneficiaryName as normalizeBeneficiaryNameDynamic } from '@/lib/beneficiary-normalizer'
import { useResponsiveChart } from '@/lib/use-responsive-chart'
import { categorizeSubside } from '@/lib/category-config'
import { createFilterPreset, loadFilterPreset } from '@/lib/filter-presets'

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



// Fonction pour générer l'URL de recherche avec filtres pour un secteur

export default function AnalysePage() {
  const [subsides, setSubsides] = useState<Subside[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDataYear, setSelectedDataYear] = useState<string>("all")
  // États pour la comparaison entre années
  const [comparisonCategoryFilter, setComparisonCategoryFilter] = useState<string>("all")
  const [selectedComparisonYears, setSelectedComparisonYears] = useState<string[]>([])
  // État pour le nombre de bénéficiaires à afficher
  const topBeneficiariesCount = 10 // Fixé à 10, sélecteur retiré
  
  // État pour le type de graphique (pie, list, bar)
  const [top10ChartType, setTop10ChartType] = useState<'pie' | 'list' | 'bar'>('pie')
  
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
      console.log('[Analyse] Click ignored (debounce)')
      return
    }
    lastClickTime.current = now
    
    try {
      const beneficiaryName = barData.name
      
      // Vérifier que le nom n'est pas trop long (sécurité)
      if (typeof beneficiaryName !== 'string' || beneficiaryName.length > 10000) {
        console.warn('[Analyse] Beneficiary name too long, skipping preset creation')
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
        console.warn('[Analyse] Failed to create filter preset, cannot redirect')
        return
      }
      
      // Vérifier que le preset existe bien avant redirection (double sécurité)
      // Note: loadFilterPreset vérifie aussi l'expiration
      const verifyPreset = loadFilterPreset(filterId)
      if (!verifyPreset) {
        console.error('[Analyse] Preset created but not found, aborting redirect')
        return
      }
      
      console.log(`[Analyse] Created filter preset ${filterId} for beneficiary: ${beneficiaryName.substring(0, 50)}...`)
      
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
        console.log(`[Analyse] Redirecting to: ${searchUrl.href}`)
        window.location.href = searchUrl.href
      } catch (urlError) {
        console.error('[Analyse] Error constructing redirect URL:', urlError)
        // Fallback: essayer avec une URL simple
        try {
          window.location.href = `/?filter=${filterId}`
        } catch (fallbackError) {
          console.error('[Analyse] Fallback redirect also failed:', fallbackError)
        }
      }
    } catch (error) {
      console.error('[Analyse] Error handling bar click:', error)
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
      console.error("Erreur lors de la détection des années:", error)
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
            const jsonData = await fetch(`/data-${year}.json`)
            
            if (!jsonData.ok) {
              return null
            }
            
            const rawData: unknown[] = await jsonData.json()
            
            if (rawData && rawData.length > 0) {
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
        const jsonData = await fetch(`/data-${dataYear}.json`)
        
        if (!jsonData.ok) {
          throw new Error(`HTTP error! status: ${jsonData.status}`)
        }
        
        const rawData: unknown[] = await jsonData.json()

        if (rawData && rawData.length > 0) {
          const normalizedData = normalizeSubsidesArray(rawData, dataYear)
          allData = normalizedData
        } else {
          throw new Error(`Aucune donnée récupérée depuis le fichier data-${dataYear}.json`)
        }
      }

      setSubsides(allData)
      
      setCachedData(allData, dataYear)
      
    } catch (apiError) {
      console.error("❌ Erreur chargement JSON:", apiError)
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
  }, [loadData, selectedDataYear])




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
        {/* Header uniforme avec navigation */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2.5 sm:p-3">
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3">
            {/* Titre et stats compactes */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1.5 xs:gap-3 flex-1 min-w-0 w-full xs:w-auto">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent whitespace-nowrap">
                  Subsides Bruxelles
                </h1>
                <div className="flex items-center gap-1" title="Prenez votre temps, travaillez doucement 💚">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-black animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} fill="currentColor" />
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '2s' }} fill="currentColor" />
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '2s' }} fill="currentColor" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs sm:text-sm">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-2 py-0.5 sm:py-1 font-semibold text-xs sm:text-sm">
                  {totalAmount.toLocaleString()} €
                </Badge>
                <span className="text-gray-600 hidden xs:inline">{totalSubsides} subsides</span>
                <Badge variant="outline" className="text-xs border-gray-300 px-1.5 py-0.5">
                  {selectedDataYear === "all" ? "Toutes" : selectedDataYear}
                </Badge>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 w-full xs:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadData(selectedDataYear)} 
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/50 hover:shadow-sm transition-all flex-shrink-0"
            >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1.5">Actualiser</span>
            </Button>
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1 h-auto">
            <Link href="/" className="flex-1 relative group">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className="relative w-full rounded-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/50 transition-all py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border-gray-200 hover:shadow-md"
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Recherche</span>
              </Button>
            </Link>
            <div className="flex-1 relative">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 animate-pulse blur-sm"></div>
              <div className="relative flex items-center justify-center rounded-md bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300/50 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-800 font-semibold shadow-sm">
                <PieChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-green-600" />
                <span className="hidden sm:inline text-green-700">Graphs</span>
                <span className="sm:hidden text-green-700">Graph</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sous-onglets pour les graphiques */}
        <Tabs defaultValue="top-beneficiaries" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1.5 h-auto">
            <TabsTrigger 
              value="top-beneficiaries" 
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 transition-all text-xs sm:text-sm font-medium py-2 sm:py-2.5 flex items-center justify-center"
            >
              Top Bénéficiaires
            </TabsTrigger>
            <TabsTrigger 
              value="by-category" 
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 transition-all text-xs sm:text-sm font-medium py-2 sm:py-2.5 flex items-center justify-center"
            >
              Par catégorie
            </TabsTrigger>
            <TabsTrigger 
              value="comparison"
              className="rounded-md data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 transition-all text-xs sm:text-sm font-medium py-2 sm:py-2.5 flex items-center justify-center"
            >
              Comparaison
            </TabsTrigger>
          </TabsList>

          {/* Nouvel onglet Top Bénéficiaires */}
          <TabsContent value="top-beneficiaries" className="space-y-6">
            {/* Top Bénéficiaires Globaux */}
            {loading ? (
              <ChartSkeleton height={500} />
            ) : (
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
                    <Top10PieChart
                      data={chartData}
                      colors={COLORS}
                      onSliceClick={handleBarClick}
                    />
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
                              return `${(value / 1000000).toFixed(1)}M€`
                            } else if (value >= 1000) {
                              return `${(value / 1000).toFixed(0)}K€`
                            } else {
                              return `${value.toLocaleString()}€`
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
                            return `${(value / 1000000).toFixed(1)}M€`
                          } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(0)}K€`
                          } else {
                            return `${value.toLocaleString()}€`
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

