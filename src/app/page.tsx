"use client"
import { LoadingScreen } from "@/components/LoadingScreen"
import { MiniEvolutionChart } from "@/components/MiniEvolutionChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Building, Download, FileText, RefreshCw, Search, Share2 } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { Subside } from '@/lib/types'
import { normalizeSubsidesArray } from '@/lib/data-normalizer'
import { exportData, type ExportColumn, DEFAULT_COLUMNS, COLUMN_LABELS } from '@/lib/data-exporter'
import { getCachedData, setCachedData } from '@/lib/cache'
import { categorizeSubside } from '@/lib/category-config'
import { loadFilterPreset, generateHash, normalizeForHash, createFilterPreset } from '@/lib/filter-presets'

export default function SubsidesDashboard() {
  const [subsides, setSubsides] = useState<Subside[]>([])
  const [filteredSubsides, setFilteredSubsides] = useState<Subside[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDataYear, setSelectedDataYear] = useState<string>("all")
  // Filtre de catégorie retiré - toujours "toutes les catégories" pour éviter les faux filtres
  const [selectedCommune, setSelectedCommune] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 40 // Augmenté pour afficher plus de résultats avec le design compact
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [presetLoaded, setPresetLoaded] = useState(false) // Prevent multiple loads

  // Fonction pour détecter automatiquement les années disponibles
  const getAvailableYears = useCallback(async (): Promise<string[]> => {
    try {
      // Liste des années possibles (étendue pour couvrir plus de cas)
      // Limiter aux années qui existent réellement pour éviter les 404
      const possibleYears = ["2024", "2023", "2022", "2021", "2020", "2019"]
      const years: string[] = ["all"]
      
      // Vérifier chaque année possible
      for (const year of possibleYears) {
        try {
          const response = await fetch(`/data-${year}.json`, { method: 'HEAD' })
          if (response.ok) {
            years.push(year)
            console.log(` Fichier data-${year}.json trouvé`)
          }
        } catch {
          // Fichier n'existe pas, continuer silencieusement
        }
      }
      
      console.log(`📅 ${years.length - 1} années de données détectées:`, years.slice(1))
      return years
    } catch (error) {
      console.error("Erreur lors de la détection des années:", error)
      // Fallback vers les années connues
      return ["all", "2024", "2023", "2022", "2021", "2020", "2019"]
    }
  }, [])

  // État pour les années disponibles
  const [availableDataYears, setAvailableDataYears] = useState<string[]>(["all", "2024", "2023", "2022", "2021", "2020", "2019"])



  // État pour le modal des informations bénéficiaire (supprimé - non utilisé)
  // const [selectedBeneficiary, setSelectedBeneficiary] = useState<string | null>(null)
  // const [beneficiaryInfo, setBeneficiaryInfo] = useState<{
  //   name: string
  //   subsides: Subside[]
  //   totalAmount: number
  //   years: string[]
  //   bceNumber: string | null
  // } | null>(null)

  // Détecter les années disponibles au chargement initial
  useEffect(() => {
    const detectYears = async () => {
      // Charger les paramètres URL en premier
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        
        // Check for filter preset first (priority over direct params)
        const filterId = urlParams.get('filter')
        if (filterId && !presetLoaded) {
          // Load preset and apply filters
          const presetFilters = loadFilterPreset(filterId)
          
          if (presetFilters) {
            // Check if this is a hash-based preset (fallback mode)
            if ('_isHash' in presetFilters && presetFilters._isHash === 'true' && '_hash' in presetFilters) {
              // Hash-based preset: need to find matching beneficiary by hash
              const targetHash = presetFilters._hash as string
              
              console.log(`[Page] Hash-based preset detected, searching for hash: ${targetHash}`)
              
              // We'll need to search through subsides to find matching hash
              // For now, we'll set a flag and search after data loads
              // Store the hash in a ref or state to use after data loads
              // Note: This requires data to be loaded first, so we'll handle it in the filtering logic
              
              // For immediate feedback, we can try to find a match in already loaded data
              // But since data loads async, we'll need to handle this in the filtering useEffect
              // Set a special search term that indicates hash search
              setSearchTerm(`__HASH_SEARCH__:${targetHash}`)
              
              if (presetFilters.year) {
                setSelectedDataYear(presetFilters.year)
              }
              
              setPresetLoaded(true)
              
              // Clean URL
              const newUrl = new URL(window.location.href)
              newUrl.searchParams.delete('filter')
              window.history.replaceState({}, '', newUrl.toString())
              
              console.log(`[Page] Hash-based preset loaded, will search for matching beneficiary`)
            } else {
              // Normal preset: apply filters directly
              if (presetFilters.search) {
                setSearchTerm(presetFilters.search)
              }
              if (presetFilters.year) {
                setSelectedDataYear(presetFilters.year)
              }
              
              // Mark as loaded to prevent reloading
              setPresetLoaded(true)
              
              // Clean URL (remove filter param) to prevent reload on refresh
              const newUrl = new URL(window.location.href)
              newUrl.searchParams.delete('filter')
              window.history.replaceState({}, '', newUrl.toString())
              
              console.log(`[Page] Loaded filter preset ${filterId}`)
            }
          } else {
            // Preset not found or expired - clean up URL
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('filter')
            window.history.replaceState({}, '', newUrl.toString())
            
            console.warn(`[Page] Filter preset ${filterId} not found or expired`)
          }
        } else {
          // No preset, load direct URL params (backward compatibility)
          const year = urlParams.get('year')
          const search = urlParams.get('search')
          
          if (year) setSelectedDataYear(year)
          if (search) setSearchTerm(search)
        }
      }
      
      const detectedYears = await getAvailableYears()
      setAvailableDataYears(detectedYears)
      console.log("📅 Années détectées:", detectedYears)
    }
    detectYears()
  }, [getAvailableYears, presetLoaded])



  // Fonction pour exporter les données
  const handleExport = useCallback((format: 'csv' | 'excel' | 'json' | 'pdf') => {
    if (filteredSubsides.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    if (selectedColumns.length === 0) {
      alert('Veuillez sélectionner au moins une colonne à exporter')
      return
    }

    setIsExporting(true)
    try {
      exportData(format, {
        data: filteredSubsides,
        filename: 'subside',
        filters: {
          year: selectedDataYear,
          // Filtre de catégorie retiré - toujours "toutes les catégories"
          category: undefined as string | undefined,
          searchTerm: searchTerm || undefined,
        },
        includeMetadata: true,
        // Toujours passer selectedColumns (même si toutes les colonnes sont sélectionnées)
        // Les fonctions d'export utiliseront DEFAULT_COLUMNS si undefined, mais on évite les problèmes
        selectedColumns: selectedColumns.length > 0 ? selectedColumns : DEFAULT_COLUMNS,
      })
      setShowExportDialog(false)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert(`Erreur lors de l'export ${format.toUpperCase()}. Veuillez réessayer.`)
    } finally {
      setIsExporting(false)
    }
  }, [filteredSubsides, selectedDataYear, searchTerm, selectedColumns])

  // Fonction pour gérer la sélection de colonnes
  const handleColumnToggle = useCallback((column: ExportColumn) => {
    setSelectedColumns((prev) => {
      if (prev.includes(column)) {
        // Désélectionner (mais garder au moins une colonne)
        const newSelection = prev.filter((c) => c !== column)
        return newSelection.length > 0 ? newSelection : prev
      } else {
        // Sélectionner
        return [...prev, column]
      }
    })
  }, [])

  // Fonction pour sélectionner/désélectionner toutes les colonnes
  const handleSelectAllColumns = useCallback(() => {
    if (selectedColumns.length === DEFAULT_COLUMNS.length) {
      // Désélectionner toutes sauf la première
      setSelectedColumns([DEFAULT_COLUMNS[0]])
    } else {
      // Sélectionner toutes
      setSelectedColumns([...DEFAULT_COLUMNS])
    }
  }, [selectedColumns])


  // Fonction pour générer les liens externes (supprimée - non utilisée)
  // const getExternalLinks = (beneficiaryName: string, bceNumber: string | null) => {
  //   const encodedName = encodeURIComponent(beneficiaryName)
  //   return {
  //     kbo: bceNumber ? 
  //       `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${bceNumber}` :
  //       `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html`,
  //     northData: `https://www.northdata.com/${encodedName}`,
  //     google: `https://www.google.com/search?q=${encodedName}+Bruxelles+ASBL`
  //   }
  // }

  // Charger les données depuis le fichier JSON
  const loadData = useCallback(async (dataYear: string = selectedDataYear) => {
    try {
      console.log('🚀 Début du chargement des données pour:', dataYear)
      setLoading(true)
      setError(null)

      // ✅ Vérifier le cache en premier (amélioration 2)
      const cachedData = getCachedData(dataYear)
      if (cachedData) {
        console.log('✅ Données récupérées depuis le cache')
        setSubsides(cachedData)
        setFilteredSubsides(cachedData)
        setLoading(false)
        return
      }

      let allData: Subside[] = []

      if (dataYear === "all") {
        console.log("🔄 Chargement de toutes les années de données...")
        
        // Détecter automatiquement les années disponibles
        const detectedYears = await getAvailableYears()
        setAvailableDataYears(detectedYears)
        
        // Charger toutes les années (sauf "all")
        const years = detectedYears.filter(year => year !== "all")
        
        // ✅ Chargement parallèle au lieu de séquentiel
        const yearPromises = years.map(async (year) => {
          try {
            console.log(`📁 Chargement des données ${year}...`)
            const jsonData = await fetch(`/data-${year}.json`)
            
            if (!jsonData.ok) {
              console.warn(`⚠️ Impossible de charger les données ${year}`)
              return null
            }
            
            const rawData: unknown[] = await jsonData.json()
            
            if (rawData && rawData.length > 0) {
              // ✅ Utilisation du normalizer centralisé pour éviter la duplication
              const normalizedData = normalizeSubsidesArray(rawData, year)
              return normalizedData
            }
            return null
          } catch (yearError) {
            console.warn(`⚠️ Erreur lors du chargement de ${year}:`, yearError)
            return null
          }
        })
        
        // ✅ Attendre tous les chargements en parallèle
        const results = await Promise.all(yearPromises)
        allData = results.filter(data => data !== null).flat()
        
        if (allData.length === 0) {
          throw new Error("Aucune donnée récupérée pour toutes les années")
        }
        
        console.log(`Total: ${allData.length} subsides de toutes les années chargés avec succès`)
      } else {
        console.log(`🔄 Chargement des données ${dataYear} depuis le fichier JSON...`)
        const jsonData = await fetch(`/data-${dataYear}.json`)
        
      if (!jsonData.ok) {
        const errorText = await jsonData.text()
        console.error("Erreur de récupération:", jsonData.status, errorText)
        throw new Error(`HTTP error! status: ${jsonData.status} - ${errorText}`)
      }
        
        const rawData: unknown[] = await jsonData.json()

        if (rawData && rawData.length > 0) {
          // ✅ Utilisation du normalizer centralisé pour éviter la duplication
          const normalizedData = normalizeSubsidesArray(rawData, dataYear)
          allData = normalizedData
          console.log(`${normalizedData.length} subsides ${dataYear} chargés avec succès`)
      } else {
          throw new Error(`Aucune donnée récupérée depuis le fichier data-${dataYear}.json`)
      }
      }

      setSubsides(allData)
      setFilteredSubsides(allData)
      
      // ✅ Mettre en cache les données chargées (amélioration 2)
      // Fallback gracieux : si le cache échoue, l'application continue de fonctionner
      setCachedData(allData, dataYear)
      
    } catch (apiError) {
      console.error("❌ Erreur chargement JSON:", apiError)
      setError(`Erreur lors du chargement des données: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
    } finally {
      console.log('🏁 Fin du chargement, setLoading(false)')
      setLoading(false)
    }
  }, [selectedDataYear, getAvailableYears])

  useEffect(() => {
    loadData(selectedDataYear)
  }, [loadData, selectedDataYear]) // ✅ Retirer loadData de la dépendance

  // Filtrage des données avec debounce pour optimiser la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    let filtered = subsides

    // Check if search term is a hash search marker (fallback mode)
    if (searchTerm.startsWith('__HASH_SEARCH__:')) {
      const targetHash = searchTerm.substring('__HASH_SEARCH__:'.length)
      
      console.log(`[Page] Hash search mode, looking for hash: ${targetHash}`)
      
      // Search through subsides to find beneficiary with matching hash
      filtered = subsides.filter((subside) => {
        const normalized = normalizeForHash(subside.beneficiaire_begunstigde)
        const hash = generateHash(normalized)
        return hash === targetHash
      })
      
      if (filtered.length > 0) {
        console.log(`[Page] Found ${filtered.length} matches for hash ${targetHash}`)
      } else {
        console.warn(`[Page] No matches found for hash ${targetHash}`)
      }
    } else if (searchTerm) {
        // Normal search
        const searchLower = searchTerm.toLowerCase().trim()
        
        // Si le terme de recherche contient plusieurs mots, chercher si TOUS les mots sont présents
        // Sinon, chercher si le terme est contenu dans les champs
        const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)
        
        filtered = filtered.filter((s) => {
          const beneficiaire = s.beneficiaire_begunstigde.toLowerCase()
          const objet = s.l_objet_de_la_subvention_doel_van_de_subsidie.toLowerCase()
          const article = s.article_complet_volledig_artikel.toLowerCase()
          const nom = s.nom_de_la_subvention_naam_van_de_subsidie.toLowerCase()
          
          // Si plusieurs mots, vérifier que tous sont présents dans le même champ (plus précis)
          // ou au moins dans le champ bénéficiaire (priorité pour les recherches de bénéficiaires)
          if (searchWords.length > 1) {
            // D'abord vérifier si tous les mots sont dans le bénéficiaire (recherche exacte)
            const allInBeneficiaire = searchWords.every(word => beneficiaire.includes(word))
            if (allInBeneficiaire) {
              return true
            }
            
            // Sinon, vérifier si tous les mots sont présents dans au moins un champ
            return searchWords.every(word => 
              beneficiaire.includes(word) ||
              objet.includes(word) ||
              article.includes(word) ||
              nom.includes(word)
            )
          } else {
            // Recherche simple avec un seul mot - priorité au bénéficiaire
            return beneficiaire.includes(searchLower) ||
                   objet.includes(searchLower) ||
                   article.includes(searchLower) ||
                   nom.includes(searchLower)
          }
        })
      }

    // Filtre de catégorie retiré - toujours "toutes les catégories"

    if (selectedCommune !== "all") {
      filtered = filtered.filter(
        (s) => s.beneficiaire_begunstigde === selectedCommune,
      )
    }

    setFilteredSubsides(filtered)
    setCurrentPage(1)
    }, 300) // Debounce de 300ms pour éviter trop de recalculs

    return () => clearTimeout(timeoutId)
  }, [subsides, searchTerm, selectedCommune])

  // Pagination
  const totalPages = Math.ceil(filteredSubsides.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSubsides = filteredSubsides.slice(startIndex, startIndex + itemsPerPage)


  // Calcul des totaux avec useMemo pour s'assurer qu'ils sont recalculés
  const totalMontant = useMemo(() => {
    // Utiliser filteredSubsides s'il y en a, sinon toutes les données
    const dataToUse = filteredSubsides.length > 0 ? filteredSubsides : subsides
    // Calculer le total de TOUS les subsides filtrés, pas seulement ceux avec une catégorie
    return dataToUse.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  }, [filteredSubsides, subsides])

  // Calcul de la plage d'années dynamique (conservé pour usage futur)
  // Calcul de la plage d'années dynamique (conservé pour usage futur)
  // const yearRange = useMemo(() => {
  //   const dataToUse = filteredSubsides.length > 0 ? filteredSubsides : subsides
  //   if (dataToUse.length === 0) return ""
  //   const years = dataToUse.map(s => s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
  //     .filter(year => year && year !== "Non spécifié")
  //     .map(year => parseInt(year))
  //     .filter(year => !isNaN(year))
  //     .sort((a, b) => a - b)
  //   if (years.length === 0) return ""
  //   const minYear = Math.min(...years)
  //   const maxYear = Math.max(...years)
  //   if (minYear === maxYear) {
  //     return `(${minYear})`
  //   } else {
  //     return `(${minYear}-${maxYear})`
  //   }
  // }, [filteredSubsides, subsides])

  const totalSubsides = useMemo(() => {
    return filteredSubsides.length
  }, [filteredSubsides])

  // Données pour le mini-graphique d'évolution par année
  const evolutionData = useMemo(() => {
    const yearMap = new Map<string, number>()
    
    filteredSubsides.forEach(subside => {
      const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
      if (year && year !== 'Non spécifié') {
        const current = yearMap.get(year) || 0
        yearMap.set(year, current + subside.montant_octroye_toegekend_bedrag)
      }
    })
    
    return Array.from(yearMap.entries())
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => a.year.localeCompare(b.year))
      .slice(-6) // Garder les 6 dernières années max pour le mini-graphique
  }, [filteredSubsides])
  
  // Calcul dynamique des catégories uniques retiré - filtre de catégorie supprimé

  // Fonction pour obtenir le schéma de couleurs selon l'année
  const getYearColorScheme = useCallback((year: string) => {
    // Palette de couleurs harmonieuses en tons pastels
    const colorSchemes: Record<string, {
      border: string
      hoverBorder: string
      hoverBg: string
      text: string
      bgFrom: string
      bgTo: string
      bgColor: string
    }> = {
      '2019': {
        border: 'border-violet-100',
        hoverBorder: 'hover:border-violet-300',
        hoverBg: 'hover:bg-violet-50/50',
        text: 'text-violet-700',
        bgFrom: 'from-violet-50',
        bgTo: 'to-violet-100',
        bgColor: 'bg-violet-100'
      },
      '2020': {
        border: 'border-pink-100',
        hoverBorder: 'hover:border-pink-300',
        hoverBg: 'hover:bg-pink-50/50',
        text: 'text-pink-700',
        bgFrom: 'from-pink-50',
        bgTo: 'to-pink-100',
        bgColor: 'bg-pink-100'
      },
      '2021': {
        border: 'border-orange-100',
        hoverBorder: 'hover:border-orange-300',
        hoverBg: 'hover:bg-orange-50/50',
        text: 'text-orange-700',
        bgFrom: 'from-orange-50',
        bgTo: 'to-orange-100',
        bgColor: 'bg-orange-100'
      },
      '2022': {
        border: 'border-amber-100',
        hoverBorder: 'hover:border-amber-300',
        hoverBg: 'hover:bg-amber-50/50',
        text: 'text-amber-700',
        bgFrom: 'from-amber-50',
        bgTo: 'to-amber-100',
        bgColor: 'bg-amber-100'
      },
      '2023': {
        border: 'border-green-100',
        hoverBorder: 'hover:border-green-300',
        hoverBg: 'hover:bg-green-50/50',
        text: 'text-green-700',
        bgFrom: 'from-green-50',
        bgTo: 'to-green-100',
        bgColor: 'bg-green-100'
      },
      '2024': {
        border: 'border-blue-100',
        hoverBorder: 'hover:border-blue-300',
        hoverBg: 'hover:bg-blue-50/50',
        text: 'text-blue-700',
        bgFrom: 'from-blue-50',
        bgTo: 'to-blue-100',
        bgColor: 'bg-blue-100'
      }
    }

    // Retourner le schéma pour l'année ou un schéma par défaut (gris neutre)
    return colorSchemes[year] || {
      border: 'border-gray-100',
      hoverBorder: 'hover:border-gray-300',
      hoverBg: 'hover:bg-gray-50/50',
      text: 'text-gray-700',
      bgFrom: 'from-gray-50',
      bgTo: 'to-gray-100',
      bgColor: 'bg-gray-100'
    }
  }, [])

  // Fonction pour tronquer les noms longs (supprimée - non utilisée)
  // const truncateName = (name: string, maxLength: number = 30): string => {
  //   if (name.length <= maxLength) return name
  //   return name.substring(0, maxLength) + "..."
  // }

  // Dédoublonner après troncature pour éviter les doublons visuels (supprimé - non utilisé)
  // const uniqueTruncatedCommunes = [...new Set(uniqueCommunes.map(commune => truncateName(commune)))]
  //   .map(truncatedName => {
  //     // Trouver le nom original le plus court qui correspond à cette troncature
  //     const matchingOriginals = uniqueCommunes.filter(commune => truncateName(commune) === truncatedName)
  //     return matchingOriginals.reduce((shortest, current) => 
  //       current.length < shortest.length ? current : shortest
  //     )
  //   })

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
      {/* Notification discrète pour la copie */}
      {showCopyNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Lien copié !
        </div>
      )}
      
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <AppHeader
          totalAmount={totalMontant}
          totalSubsides={totalSubsides}
          selectedYear={selectedDataYear}
          currentPage="search"
          showStats={true}
          showNavigation={true}
        />

        {/* Contenu Recherche */}
        <div className="space-y-4 sm:space-y-6">

        {/* Barre de filtres compacte - Design moderne inspiré Codepink */}
        <Card className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <CardContent className="p-3 sm:p-4">
            {/* Barre de filtres horizontale compacte */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              {/* Recherche - Prend plus d'espace */}
              <div className="flex-1 min-w-0 group">
              <div className="relative">
                  {/* Glow effect au focus */}
                  <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-green-400/30 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300 pointer-events-none"></div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-green-600 z-10 transition-colors duration-200 group-focus-within:text-green-700" />
                    <Input
                        placeholder="Rechercher un bénéficiaire, projet..."
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value
                        // Limiter à 24 caractères maximum
                        if (value.length <= 24) {
                          setSearchTerm(value)
                        }
                      }}
                      maxLength={24}
                        className="pl-9 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-11 text-sm border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 rounded-lg bg-green-50/50 focus:bg-white transition-all duration-200 shadow-sm focus:shadow-lg"
                        style={{ caretColor: '#10b981' }}
                      />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-full p-1 transition-all duration-200 z-10 min-h-[44px] sm:min-h-0 flex items-center justify-center"
                        title="Vider la recherche"
                          aria-label="Vider la recherche"
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
              </div>
              </div>

              {/* Filtres compacts */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                {/* Année */}
                <Select value={selectedDataYear} onValueChange={(value) => {
                  console.log("Changement d'année:", value)
                  setSelectedDataYear(value)
                }}>
                  <SelectTrigger className="h-10 w-full sm:w-[160px] text-sm border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-md bg-white flex items-center justify-center [&>svg]:hidden">
                    <SelectValue placeholder="Année" className="text-center" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataYears.map((year) => (
                      <SelectItem key={`data-year-${year}`} value={year}>
                        {year === "all" ? "Toutes les années" : year}
                      </SelectItem>
                    ))}
                    {availableDataYears.length === 1 && (
                      <SelectItem value="loading" disabled>
                        🔄 Détection...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Filtre de catégorie retiré - toujours "toutes les catégories" */}
            </div>

              {/* Boutons d'action compacts */}
              <div className="flex gap-2 flex-shrink-0">
                {/* Menu d'export */}
                <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isExporting || filteredSubsides.length === 0}
                      className="h-10 sm:h-9 px-3 text-sm border-gray-300 hover:bg-gray-50 rounded-md min-h-[44px] sm:min-h-0"
                      title="Exporter les données"
                    >
                      <Download className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Exporter les données
                      </DialogTitle>
                      <DialogDescription>
                        Choisissez les colonnes à exporter et le format de fichier
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* Info sur la sélection des subsides */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-green-900">
                        {filteredSubsides.length} subside{filteredSubsides.length > 1 ? 's' : ''} sera{filteredSubsides.length > 1 ? 'ont' : ''} exporté{filteredSubsides.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    {/* Sélection de colonnes */}
                    <div className="space-y-3 border-t border-b py-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">Colonnes à exporter</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllColumns}
                          className="text-xs sm:text-sm h-9 sm:h-8 px-3 sm:px-2 min-h-[44px] sm:min-h-0"
                        >
                          {selectedColumns.length === DEFAULT_COLUMNS.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {DEFAULT_COLUMNS.map((column) => (
                          <label
                            key={column}
                            className="flex items-center gap-2 p-2 rounded border border-gray-300 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(column)}
                              onChange={() => handleColumnToggle(column)}
                              className="w-4 h-4 text-green-900 border-gray-300 rounded focus:ring-green-700"
                            />
                            <span className="text-sm sm:text-base text-gray-700">{COLUMN_LABELS[column]}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {selectedColumns.length} colonne{selectedColumns.length > 1 ? 's' : ''} sélectionnée{selectedColumns.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Boutons d'export */}
                    <div className="space-y-3">
                      <Button
                        onClick={() => handleExport('csv')}
                        disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
                        className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium transition-all min-h-[44px] text-sm sm:text-base"
                        style={{
                          backgroundColor: '#A7F3D0', // Pastel vert menthe
                          borderColor: '#6EE7B7',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#86EFAC'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#A7F3D0'
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Exporter en CSV
                        <span className="text-xs opacity-75">(Excel compatible)</span>
                      </Button>

                      <Button
                        onClick={() => handleExport('excel')}
                        disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
                        className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium transition-all min-h-[44px] text-sm sm:text-base"
                        style={{
                          backgroundColor: '#BFDBFE', // Pastel bleu
                          borderColor: '#93C5FD',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#93C5FD'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#BFDBFE'
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Exporter en Excel (XLSX)
                      </Button>

                      <Button
                        onClick={() => handleExport('json')}
                        disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
                        className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium transition-all min-h-[44px] text-sm sm:text-base"
                        style={{
                          backgroundColor: '#E9D5FF', // Pastel violet lavande
                          borderColor: '#D8B4FE',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#D8B4FE'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#E9D5FF'
                          }
                        }}
                      >
                        <Download className="w-4 h-4" />
                        Exporter en JSON
                        <span className="text-xs opacity-75">(Développeurs)</span>
                      </Button>

                      <Button
                        onClick={() => handleExport('pdf')}
                        disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
                        className="w-full flex items-center justify-center gap-2 text-gray-800 font-semibold transition-all"
                        style={{
                          backgroundColor: '#FBCFE8', // Pastel rose
                          borderColor: '#F9A8D4',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#F9A8D4'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.backgroundColor = '#FBCFE8'
                          }
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Exporter en PDF
                        <span className="text-xs opacity-75">(summary)</span>
                      </Button>
                    </div>

                    {isExporting && (
                      <div className="text-center text-sm text-gray-500 mt-2">
                        Export en cours...
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                      size="sm"
                      className="h-10 sm:h-9 px-3 text-sm border-gray-300 hover:bg-gray-50 rounded-md min-h-[44px] sm:min-h-0"
                      title="Partager"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Share2 className="w-5 h-5" />
                      Partager Subsides Bruxelles
                    </DialogTitle>
                    <DialogDescription>
                      Partagez cette application de transparence des finances publiques
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Twitter/X */}
                      <Button
                        onClick={() => {
                          const text = "Découvrez la transparence des subsides bruxellois - Données officielles 2019-2024"
                          const url = new URL(window.location.href)
                          url.searchParams.set('year', selectedDataYear)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url.toString())}`
                          window.open(shareUrl, '_blank')
                        }}
                        className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white h-12 sm:h-10 text-sm sm:text-base min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X (Twitter)
                      </Button>

                      {/* LinkedIn */}
                      <Button
                        onClick={() => {
                          const url = new URL(window.location.href)
                          url.searchParams.set('year', selectedDataYear)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          const fullText = `Découvrez la transparence des subsides bruxellois ${url.toString()}`
                          window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullText)}`, '_blank')
                        }}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white h-12 sm:h-10 text-sm sm:text-base min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </Button>

                      {/* Copier le lien */}
                      <Button
                        onClick={() => {
                          const url = new URL(window.location.href)
                          url.searchParams.set('year', selectedDataYear)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          
                          navigator.clipboard.writeText(url.toString()).then(() => {
                            setShowCopyNotification(true)
                            setTimeout(() => setShowCopyNotification(false), 2000)
                          }).catch(() => {
                            // Fallback
                            const textArea = document.createElement('textarea')
                            textArea.value = url.toString()
                            document.body.appendChild(textArea)
                            textArea.select()
                            document.execCommand('copy')
                            document.body.removeChild(textArea)
                            setShowCopyNotification(true)
                            setTimeout(() => setShowCopyNotification(false), 2000)
                          })
                        }}
                        className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white h-12 sm:h-10 text-sm sm:text-base min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copier le lien
                      </Button>

                      {/* WhatsApp */}
                      <Button
                        onClick={() => {
                          const text = "Découvrez la transparence des subsides bruxellois"
                          const url = new URL(window.location.href)
                          url.searchParams.set('year', selectedDataYear)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url.toString())}`, '_blank')
                        }}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white h-12 sm:h-10 text-sm sm:text-base min-h-[44px]"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
                </CardContent>
              </Card>

        {/* Liste des subsides - Design compact avec dégradés */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-200 to-blue-200 text-gray-800 rounded-t-lg px-3 sm:px-4 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold">Liste des subsides ({filteredSubsides.length} résultats)</CardTitle>
                <CardDescription className="text-xs text-gray-700 hidden sm:block">Cliquez pour les détails</CardDescription>
              </div>
              {/* Mini-graphique d'évolution */}
              {evolutionData.length > 1 && (
                <div className="flex items-center justify-end sm:justify-start flex-shrink-0">
                  <MiniEvolutionChart 
                    data={evolutionData}
                    height={50}
                    className="w-[200px] sm:w-[400px]"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                {paginatedSubsides.map((subside, index) => {
                  // Obtenir le schéma de couleurs selon l'année
                  const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
                  const colorScheme = getYearColorScheme(year)
                  
                return (
                <Dialog key={`${subside.nom_de_la_subvention_naam_van_de_subsidie}-${subside.beneficiaire_begunstigde}-${subside.article_complet_volledig_artikel}-${index}`}>
                  <DialogTrigger asChild>
                    <div className={`border-2 rounded-lg p-2.5 sm:p-3 hover:shadow-lg cursor-pointer transition-all bg-white/90 backdrop-blur-sm ${colorScheme.border} ${colorScheme.hoverBorder} ${colorScheme.hoverBg}`}>
                      
                      {/* Nom du bénéficiaire */}
                      <h3 
                        className={`font-semibold text-xs sm:text-sm ${colorScheme.text} mb-1.5 sm:mb-2 line-clamp-1`}
                        title={subside.beneficiaire_begunstigde}
                      >
                        {subside.beneficiaire_begunstigde}
                      </h3>
                      
                      {/* Montant - Plus discret, sans Badge */}
                      <div className="mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">
                          {subside.montant_octroye_toegekend_bedrag.toLocaleString()} €
                        </span>
                      </div>
                      
                      {/* Année et Catégorie - Plus petits */}
                      <div className="flex flex-wrap gap-1 items-center">
                        <Badge className="bg-gradient-to-r from-indigo-100 to-slate-100 text-gray-600 border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-normal">
                          {subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-blue-100 to-cyan-100 text-gray-600 border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-normal line-clamp-1">
                          {categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)}
                        </Badge>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className={`w-[95vw] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-0 border-2 ${colorScheme.border} rounded-lg`}>
                    {/* Header avec couleur de l'année */}
                    <div className={`bg-gradient-to-r ${colorScheme.bgFrom} ${colorScheme.bgTo} rounded-t-lg px-4 sm:px-6 py-3 sm:py-4 border-b-2 ${colorScheme.border}`}>
                      <DialogHeader className="space-y-1 sm:space-y-2">
                        <DialogTitle className={`flex items-center gap-2 text-sm sm:text-base ${colorScheme.text} font-semibold line-clamp-2`}>
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="break-words">{subside.beneficiaire_begunstigde}</span>
                        </DialogTitle>
                        {/* Badge année */}
                        <div className="flex items-center gap-2 pt-1">
                          <Badge className={`${colorScheme.bgColor} ${colorScheme.text} border-0 text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 font-semibold`}>
                            {year}
                          </Badge>
                        </div>
                      </DialogHeader>
                    </div>

                    {/* Contenu scrollable */}
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                          {/* Liens externes - En haut et colorés avec style de l'année */}
                          <div className={`bg-gradient-to-r ${colorScheme.bgFrom} ${colorScheme.bgTo} rounded-lg p-3 sm:p-4 border ${colorScheme.border}`}>
                            <h4 className={`font-semibold text-sm sm:text-base mb-2 sm:mb-3 ${colorScheme.text}`}>
                              Liens externes
                            </h4>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                        {subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie && (
                          <>
                          <Button
                              onClick={() => {
                                // Utilise source_url_kbo si disponible, sinon construit l'URL avec le numéro BCE (cohérent avec l'export)
                                const bceNumber = subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie
                                const kboUrl = subside.source_url_kbo || (bceNumber ? `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${bceNumber.trim()}` : null)
                                if (kboUrl) {
                                  window.open(kboUrl, '_blank')
                                }
                              }}
                                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 min-h-[44px] text-sm sm:text-base"
                          >
                            <Building className="w-4 h-4" />
                            Registre KBO
                          </Button>
                        <Button
                              onClick={() => {
                                // North Data fonctionne avec le nom de l'entreprise (pas le numéro BCE)
                                // Utilise source_url_north_data si disponible (généré avec le nom), sinon construit l'URL
                                const northDataUrl = subside.source_url_north_data || (() => {
                                  const encodedName = encodeURIComponent(subside.beneficiaire_begunstigde)
                                  return `https://www.northdata.com/${encodedName}`
                                })()
                                window.open(northDataUrl, '_blank')
                              }}
                                className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 min-h-[44px] text-sm sm:text-base"
                        >
                          <FileText className="w-4 h-4" />
                          North Data
                        </Button>
                          </>
                        )}
                        <Button
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(subside.beneficiaire_begunstigde + ' Bruxelles subside')}`, '_blank')}
                                className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 min-h-[44px] text-sm sm:text-base"
                        >
                          <Search className="w-4 h-4" />
                          Google
                        </Button>
                        <Button
                          onClick={() => {
                            // Utilise source_url_open_data si disponible, sinon utilise l'URL par défaut (cohérent avec l'export)
                            const openDataUrl = subside.source_url_open_data || 'https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score'
                            window.open(openDataUrl, '_blank')
                          }}
                                className="flex items-center justify-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 hover:border-violet-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 min-h-[44px] text-sm sm:text-base"
                        >
                          <FileText className="w-4 h-4" />
                          Source Data
                        </Button>
                      </div>
                    </div>

                          <div className="space-y-4 sm:space-y-6">
                            {/* Informations financières */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className={`font-semibold text-sm sm:text-base ${colorScheme.text}`}>
                                Informations financières
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Montant octroyé</h5>
                                <p className={`text-lg sm:text-xl md:text-2xl font-bold ${colorScheme.text}`}>
                            {subside.montant_octroye_toegekend_bedrag.toLocaleString()} €
                          </p>
                        </div>
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Montant prévu au budget</h5>
                                  <p className={`text-base sm:text-lg font-semibold ${colorScheme.text}`}>
                              {subside.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023.toLocaleString()} €
                            </p>
                          </div>
                        </div>
                      </div>

                            {/* Informations bénéficiaire */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className={`font-semibold text-sm sm:text-base ${colorScheme.text}`}>
                                Informations bénéficiaire
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Nom</h5>
                                  <button
                                    onClick={() => {
                                      // Créer un filter preset pour partage
                                      const filterId = createFilterPreset(
                                        {
                                          search: subside.beneficiaire_begunstigde,
                                          year: selectedDataYear !== 'all' ? selectedDataYear : undefined,
                                        },
                                        'beneficiary'
                                      )
                                      
                                      // Rediriger vers la liste filtrée
                                      if (filterId && typeof window !== 'undefined') {
                                        window.location.href = `/?filter=${filterId}`
                                      } else {
                                        // Fallback : appliquer le filtre localement
                                        setSearchTerm(subside.beneficiaire_begunstigde)
                                      }
                                    }}
                                    className={`font-semibold text-sm sm:text-base ${colorScheme.text} hover:opacity-80 active:opacity-70 hover:underline active:underline cursor-pointer text-left flex items-center gap-2 group min-h-[44px] sm:min-h-0 py-1 sm:py-0 touch-manipulation w-full`}
                                    title={`Voir tous les subsides de ${subside.beneficiaire_begunstigde}`}
                                  >
                                    <span className="flex-1 break-words">{subside.beneficiaire_begunstigde}</span>
                                    <Badge variant="outline" className={`text-xs font-normal opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 ${colorScheme.border}`}>
                                      {subsides.filter(s => s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde).length} subside{subsides.filter(s => s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde).length > 1 ? 's' : ''}
                                    </Badge>
                                  </button>
                                </div>
                                <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Numéro BCE (KBO)</h5>
                            <p className={`${colorScheme.text} font-medium`}>
                              {subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie ||
                                "Non spécifié"}
                            </p>
                          </div>
                        </div>
                      </div>

                            {/* Informations projet */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className={`font-semibold text-sm sm:text-base ${colorScheme.text}`}>
                                Projet
                              </h4>
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm space-y-3 sm:space-y-4`}>
                                <div>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Nom</h5>
                                  <p className="text-sm sm:text-base font-medium">{subside.nom_de_la_subvention_naam_van_de_subsidie}</p>
                                </div>
                                <div>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Objectif</h5>
                                  <p className="text-sm sm:text-base">{subside.l_objet_de_la_subvention_doel_van_de_subsidie}</p>
                                </div>
                              </div>
                            </div>

                            {/* Informations administratives */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className={`font-semibold text-sm sm:text-base ${colorScheme.text}`}>
                                Informations administratives
                              </h4>
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">N° de dossier</h5>
                            <p className={`font-mono text-sm sm:text-base ${colorScheme.text} font-semibold`}>{subside.article_complet_volledig_artikel}</p>
                          </div>
                      </div>
                    </div>
                    </div>
                  </DialogContent>
                </Dialog>
                )
              })}

              {filteredSubsides.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Aucun subside ne correspond aux critères de recherche.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="min-h-[44px] sm:min-h-0"
                >
                  Précédent
                </Button>

                <div className="flex gap-1">
                  {/* Pagination intelligente - affiche seulement quelques numéros */}
                  {(() => {
                    const pages = []
                    
                    // Toujours afficher la première page
                    if (totalPages > 0) {
                      pages.push(1)
                    }
                    
                    // Calculer la plage de pages à afficher autour de la page courante
                    const start = Math.max(2, currentPage - 1)
                    const end = Math.min(totalPages - 1, currentPage + 1)
                    
                    // Ajouter "..." si nécessaire
                    if (start > 2) {
                      pages.push('...')
                    }
                    
                    // Ajouter les pages autour de la page courante
                    for (let i = start; i <= end; i++) {
                      if (i !== 1 && i !== totalPages) {
                        pages.push(i)
                      }
                    }
                    
                    // Ajouter "..." si nécessaire
                    if (end < totalPages - 1) {
                      pages.push('...')
                    }
                    
                    // Toujours afficher la dernière page (si différente de la première)
                    if (totalPages > 1) {
                      pages.push(totalPages)
                    }
                    
                    return pages.map((page, index) => (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={page === '...'}
                        className={`min-h-[44px] sm:min-h-0 ${currentPage === page ? "text-gray-800 font-medium" : ""}`}
                        style={currentPage === page ? {
                          backgroundColor: '#A7F3D0', // Pastel vert menthe
                          borderColor: '#6EE7B7',
                        } : undefined}
                      >
                        {page}
                      </Button>
                    ))
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="min-h-[44px] sm:min-h-0"
                >
                  Suivant
                </Button>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
