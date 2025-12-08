"use client"
import { lazy, Suspense, startTransition } from "react"
import { SkeletonLoader } from "@/components/SkeletonLoader"
// Lazy load MiniEvolutionChart (contient Recharts)
const MiniEvolutionChart = lazy(() => import("@/components/MiniEvolutionChart").then(module => ({ default: module.MiniEvolutionChart })))
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
import { AlertCircle, Building, ChevronLeft, ChevronRight, Download, FileText, RefreshCw, Search, Share2, Link2 } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Lazy loading des Dialogs pour performance (Solution 1)
const ExportDialog = lazy(() => import("@/components/ExportDialog").then(module => ({ default: module.ExportDialog })))
const ShareDialog = lazy(() => import("@/components/ShareDialog").then(module => ({ default: module.ShareDialog })))

import { useCallback, useEffect, useMemo, useState, useDeferredValue } from "react"

import type { Subside } from '@/lib/types'
import { normalizeSubsidesArray } from '@/lib/data-normalizer'
import { type ExportColumn, DEFAULT_COLUMNS } from '@/lib/data-exporter'
// Lazy load exportData pour éviter de charger XLSX + jsPDF au montage (700KB économisés!)
const loadExportData = () => import('@/lib/data-exporter').then(m => m.exportData)
import { getCachedData, setCachedData, getCachedComputation, setCachedComputation } from '@/lib/cache'
import { categorizeSubside } from '@/lib/category-config'
import { loadFilterPreset, generateHash, normalizeForHash } from '@/lib/filter-presets'
import { devLog, devWarn, devError, formatNumberWithSpaces } from '@/lib/utils'
// ⚠️ DÉSACTIVÉ : detectRelationships supprimé - Les relations seront pré-calculées dans les JSON lors de l'ajout de données
// Type local simple pour le state (jamais utilisé car calcul désactivé, mais nécessaire pour le JSX)
type OrganizationRelationship = {
  sourceOrg: string
  targetOrg: string
  confidence: number
  mentionCount: number
  years: string[]
  contexts: Array<{
    objet: string
    annee: string
    montant: number
  }>
}

// Totaux fixes calculés une seule fois (calculés depuis les fichiers JSON)
// Ces valeurs sont utilisées pour afficher le total global quand il n'y a pas de recherche
const TOTAL_SUBSIDES = 7635 // Total de tous les subsides (2019-2024)
const TOTAL_MONTANT = 949437072 // Total en euros (calculé depuis les fichiers JSON: 2019=0, 2020=82042, 2021=146202, 2022=294380820, 2023=317443715, 2024=337384293)

// Fonction pour obtenir le schéma de couleurs selon l'année (hors composant pour performance)
const getYearColorScheme = (year: string) => {
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
      text: 'text-blue-900',
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
}

export default function SubsidesDashboard() {
  const [subsides, setSubsides] = useState<Subside[]>([])
  const [filteredSubsides, setFilteredSubsides] = useState<Subside[]>([])
  // CRITIQUE: Plus de state loading - la page s'affiche immédiatement
  // Les données se chargeront en arrière-plan sans bloquer la navigation
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDataYear, setSelectedDataYear] = useState<string>("all")
  // Filtre de catégorie retiré - toujours "toutes les catégories" pour éviter les faux filtres
  const [selectedCommune] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 40 // Augmenté pour afficher plus de résultats avec le design compact
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [errorNotification, setErrorNotification] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  // Colonnes pré-sélectionnées par défaut : article, bénéficiaire, montant, objet, année
  const DEFAULT_SELECTED_COLUMNS: ExportColumn[] = [
    'article_complet',
    'beneficiaire',
    'montant_octroye',
    'objet',
    'annee_debut',
  ]
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(DEFAULT_SELECTED_COLUMNS)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [presetLoaded, setPresetLoaded] = useState(false) // Prevent multiple loads
  const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null) // Contrôle l'ouverture du Dialog

  // Fonction pour détecter automatiquement les années disponibles
  // OPTIMISATION: Cache pour éviter les requêtes HEAD répétées
  // Optimisée : ne fait pas de requêtes HEAD séquentielles qui ralentissent le chargement
  const getAvailableYears = useCallback(async (): Promise<string[]> => {
    // Vérifier le cache d'abord (TTL: 24h car les années ne changent pas souvent)
    const cacheKey = 'availableYears'
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          const now = Date.now()
          // Cache valide pendant 24h
          if (now - timestamp < 24 * 60 * 60 * 1000) {
            devLog('✅ Années récupérées depuis le cache')
            return data
          }
        }
      } catch {
        // Ignorer les erreurs de cache
      }
    }

    try {
      // ✅ EXCLURE EXPLICITEMENT 2025 - Ne charger que les années complètes (2019-2024)
      // 2025 sera géré séparément dans une autre partie de l'application
      const possibleYears = ["2024", "2023", "2022", "2021", "2020", "2019"]
      const years: string[] = ["all"]
      
      // Vérifier toutes les années en parallèle pour plus de rapidité
      const yearChecks = possibleYears.map(async (year) => {
        try {
          // ✅ Ne pas charger data-2025-incomplete.json ou tout fichier 2025
          if (year.startsWith('2025')) {
            return null
          }
          
          const response = await fetch(`/data-${year}.json`, { method: 'HEAD' })
          if (response.ok) {
            return year
          }
        } catch {
          // Fichier n'existe pas
        }
        return null
      })
      
      const results = await Promise.all(yearChecks)
      const foundYears = results.filter((year): year is string => year !== null)
      years.push(...foundYears)
      
      // Mettre en cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: years,
            timestamp: Date.now()
          }))
        } catch {
          // Ignorer les erreurs de cache
        }
      }
      
      devLog(`📅 ${foundYears.length} années de données détectées:`, foundYears)
      return years
    } catch (error) {
      devError("Erreur lors de la détection des années:", error)
      // Fallback vers les années connues (sans 2025)
      return ["all", "2024", "2023", "2022", "2021", "2020", "2019"]
    }
  }, [])

  // État pour les années disponibles
  const [availableDataYears, setAvailableDataYears] = useState<string[]>(["all", "2024", "2023", "2022", "2021", "2020", "2019"])




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
              
              devLog(`[Page] Hash-based preset detected, searching for hash: ${targetHash}`)
              
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
              
              devLog(`[Page] Hash-based preset loaded, will search for matching beneficiary`)
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
              
              devLog(`[Page] Loaded filter preset ${filterId}`)
            }
          } else {
            // Preset not found or expired - clean up URL
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('filter')
            window.history.replaceState({}, '', newUrl.toString())
            
            devWarn(`[Page] Filter preset ${filterId} not found or expired`)
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
      devLog("📅 Années détectées:", detectedYears)
    }
    detectYears()
  }, [getAvailableYears, presetLoaded])



  // Fonction pour afficher une notification d'erreur
  const showErrorNotification = useCallback((message: string) => {
    setErrorNotification(message)
    setTimeout(() => setErrorNotification(null), 5000) // Auto-dismiss après 5 secondes
  }, [])

  // Fonction pour exporter les données (lazy load exportData pour éviter XLSX + jsPDF au montage)
  const handleExport = useCallback(async (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    if (filteredSubsides.length === 0) {
      showErrorNotification('Aucune donnée à exporter')
      return
    }

    if (selectedColumns.length === 0) {
      showErrorNotification('Veuillez sélectionner au moins une colonne à exporter')
      return
    }

    setIsExporting(true)
    // Utiliser startTransition pour ne pas bloquer l'UI
    startTransition(async () => {
      try {
        // Lazy load exportData seulement quand nécessaire (XLSX + jsPDF = 700KB économisés!)
        const exportData = await loadExportData()
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
        devError('Erreur lors de l\'export:', error)
        showErrorNotification(`Erreur lors de l'export ${format.toUpperCase()}. Veuillez réessayer.`)
      } finally {
        setIsExporting(false)
      }
    })
  }, [filteredSubsides, selectedDataYear, searchTerm, selectedColumns, showErrorNotification])
  
  // Handler pour copier le lien (optimisé avec startTransition)
  const handleCopyLink = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('year', selectedDataYear)
    if (searchTerm) url.searchParams.set('search', searchTerm)
    
    startTransition(() => {
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
    })
  }, [selectedDataYear, searchTerm])

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
    setSelectedColumns((prev) => {
      // Utiliser la fonction de mise à jour pour éviter la dépendance sur selectedColumns
      if (prev.length === DEFAULT_COLUMNS.length) {
        // Désélectionner toutes sauf la première
        return [DEFAULT_COLUMNS[0]]
      } else {
        // Sélectionner toutes
        return [...DEFAULT_COLUMNS]
      }
    })
  }, []) // Plus besoin de selectedColumns dans les dépendances



  // Charger les données depuis le fichier JSON
  const loadData = useCallback(async (dataYear: string = selectedDataYear) => {
    try {
      devLog('🚀 Début du chargement des données pour:', dataYear)
      // Plus de setLoading - données chargées en arrière-plan sans bloquer
      setError(null)

      // ✅ Vérifier le cache en premier (amélioration 2)
      const cachedData = getCachedData(dataYear)
      if (cachedData) {
        devLog('✅ Données récupérées depuis le cache')
        setSubsides(cachedData)
        setFilteredSubsides(cachedData)
        // setLoading(false) // Plus nécessaire
        return
      }

      let allData: Subside[] = []

      if (dataYear === "all") {
        devLog("🔄 Chargement de toutes les années de données...")
        
        // Détecter automatiquement les années disponibles
        const detectedYears = await getAvailableYears()
        setAvailableDataYears(detectedYears)
        
        // Charger toutes les années (sauf "all")
        // ✅ EXCLURE EXPLICITEMENT 2025 - Ne charger que les années complètes
        const years = detectedYears.filter(year => year !== "all" && !year.startsWith('2025'))
        
        // ✅ Chargement parallèle au lieu de séquentiel
        const yearPromises = years.map(async (year) => {
          try {
            // ✅ Double vérification : ne pas charger 2025
            if (year.startsWith('2025')) {
              devWarn(`⚠️ Année 2025 exclue du chargement (données incomplètes)`)
              return null
            }
            
            devLog(`📁 Chargement des données ${year}...`)
            const jsonData = await fetch(`/data-${year}.json`)
            
            if (!jsonData.ok) {
              devWarn(`⚠️ Impossible de charger les données ${year}`)
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
            devWarn(`⚠️ Erreur lors du chargement de ${year}:`, yearError)
            return null
          }
        })
        
        // ✅ Attendre tous les chargements en parallèle
        const results = await Promise.all(yearPromises)
        allData = results.filter(data => data !== null).flat()
        
        if (allData.length === 0) {
          throw new Error("Aucune donnée récupérée pour toutes les années")
        }
        
        devLog(`Total: ${allData.length} subsides de toutes les années chargés avec succès`)
      } else {
        devLog(`🔄 Chargement des données ${dataYear} depuis le fichier JSON...`)
        const jsonData = await fetch(`/data-${dataYear}.json`)
        
      if (!jsonData.ok) {
        const errorText = await jsonData.text()
        devError("Erreur de récupération:", jsonData.status, errorText)
        throw new Error(`HTTP error! status: ${jsonData.status} - ${errorText}`)
      }
        
        const rawData: unknown[] = await jsonData.json()

        if (rawData && rawData.length > 0) {
          // ✅ Utilisation du normalizer centralisé pour éviter la duplication
          const normalizedData = normalizeSubsidesArray(rawData, dataYear)
          allData = normalizedData
          devLog(`${normalizedData.length} subsides ${dataYear} chargés avec succès`)
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
      devError("❌ Erreur chargement JSON:", apiError)
      setError(`Erreur lors du chargement des données: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
    } finally {
      devLog('🏁 Fin du chargement')
      // setLoading(false) // Plus nécessaire - données chargées en arrière-plan
    }
  }, [selectedDataYear, getAvailableYears])

  // Charger les données en arrière-plan (non-bloquant pour la navigation)
  useEffect(() => {
    // Utiliser startTransition pour ne pas bloquer la navigation
    startTransition(() => {
      loadData(selectedDataYear)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataYear]) // loadData est stable grâce à useCallback, on utilise seulement selectedDataYear

  // OPTIMISATION: Utiliser useDeferredValue pour la recherche (React 18)
  // Cela permet de garder l'UI réactive pendant que la recherche se fait en arrière-plan
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const deferredSelectedCommune = useDeferredValue(selectedCommune)

  // Filtrage des données optimisé avec useDeferredValue
  useEffect(() => {
    let filtered = subsides

    // Check if search term is a hash search marker (fallback mode)
    if (deferredSearchTerm.startsWith('__HASH_SEARCH__:')) {
      const targetHash = deferredSearchTerm.substring('__HASH_SEARCH__:'.length)
      
      devLog(`[Page] Hash search mode, looking for hash: ${targetHash}`)
      
      // Search through subsides to find beneficiary with matching hash
      filtered = subsides.filter((subside) => {
        const normalized = normalizeForHash(subside.beneficiaire_begunstigde)
        const hash = generateHash(normalized)
        return hash === targetHash
      })
      
      if (filtered.length > 0) {
        devLog(`[Page] Found ${filtered.length} matches for hash ${targetHash}`)
      } else {
        devWarn(`[Page] No matches found for hash ${targetHash}`)
      }
    } else if (deferredSearchTerm) {
        // Normal search
        const searchLower = deferredSearchTerm.toLowerCase().trim()
        
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

    if (deferredSelectedCommune !== "all") {
      filtered = filtered.filter(
        (s) => s.beneficiaire_begunstigde === deferredSelectedCommune,
      )
    }

    setFilteredSubsides(filtered)
    setCurrentPage(1)
  }, [subsides, deferredSearchTerm, deferredSelectedCommune])

  // Pagination - mémorisé pour éviter les recalculs
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredSubsides.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedSubsides = filteredSubsides.slice(startIndex, startIndex + itemsPerPage)
    return { totalPages, startIndex, paginatedSubsides }
  }, [filteredSubsides, currentPage, itemsPerPage])
  
  const { totalPages, paginatedSubsides } = paginationData


  // Totaux des résultats filtrés (calculés dynamiquement)
  // Afficher seulement quand il y a une recherche active
  const filteredTotalSubsides = filteredSubsides.length
  const filteredTotalMontant = useMemo(() => {
    return filteredSubsides.reduce((sum, subside) => sum + (subside.montant_octroye_toegekend_bedrag || 0), 0)
  }, [filteredSubsides])

  // Données pour le mini-graphique d'évolution par année
  // OPTIMISATION: Mise en cache pour éviter les recalculs inutiles
  const evolutionData = useMemo(() => {
    // Vérifier le cache d'abord
    const cacheKey = `evolutionData_${selectedDataYear}`
    // Hash simple basé sur les premiers subsides pour détecter les changements
    const dataHash = filteredSubsides.length > 0 
      ? JSON.stringify(filteredSubsides.slice(0, 10).map(s => ({
          year: s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
          amount: s.montant_octroye_toegekend_bedrag
        })))
      : 'empty'
    
    const cached = getCachedComputation<Array<{year: string, amount: number}>>(cacheKey, dataHash)
    if (cached) {
      devLog('✅ evolutionData récupéré depuis le cache')
      return cached
    }

    // Sinon, calculer
    const yearMap = new Map<string, number>()
    
    filteredSubsides.forEach(subside => {
      const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
      if (year && year !== 'Non spécifié') {
        const current = yearMap.get(year) || 0
        yearMap.set(year, current + subside.montant_octroye_toegekend_bedrag)
      }
    })
    
    const result = Array.from(yearMap.entries())
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => a.year.localeCompare(b.year))
      .slice(-6) // Garder les 6 dernières années max pour le mini-graphique
    
    // Mettre en cache
    setCachedComputation(cacheKey, result, filteredSubsides)
    
    return result
  }, [filteredSubsides, selectedDataYear])

  // Détection des relations entre organisations
  // ⚠️ DÉSACTIVÉ TEMPORAIREMENT : Calcul trop lourd pour la page d'accueil
  // Les relations seront calculées hors ligne lors de l'ajout de données et flaggées dans les JSON
  // Réactiver seulement quand les données seront pré-calculées dans les fichiers JSON
  // Le state est gardé pour que le JSX ne casse pas (les conditions .has() retourneront false)
  const [organizationRelationships] = useState<Map<string, OrganizationRelationship[]>>(new Map())

  // ⚠️ CALCUL DÉSACTIVÉ - Les relations seront pré-calculées dans les JSON lors de l'ajout de données
  // Ce calcul sera fait une fois hors ligne, pas à chaque chargement de page
  // useEffect(() => {
  //   if (subsides.length === 0) {
  //     setOrganizationRelationships(new Map())
  //     return
  //   }
  //   // ... code désactivé ...
  // }, [subsides, selectedDataYear])


  // Afficher un skeleton seulement si pas de données ET pas d'erreur
  // Mais ne pas bloquer la navigation - la page s'affiche immédiatement
  const showSkeleton = subsides.length === 0 && !error

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadData(selectedDataYear)} className="flex items-center gap-2" aria-label="Réessayer de charger les données">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  // Afficher la page immédiatement, avec skeleton si pas de données
  if (showSkeleton) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Notification discrète pour la copie */}
      {showCopyNotification && (
        <div 
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Lien copié !</span>
        </div>
      )}
      
      {/* Notification d'erreur */}
      {errorNotification && (
        <div 
          className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span>{errorNotification}</span>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <AppHeader
          selectedYear={selectedDataYear}
          currentPage="search"
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
                        placeholder="..."
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value
                        // Limiter à 24 caractères maximum
                        if (value.length <= 24) {
                          setSearchTerm(value)
                        }
                      }}
                      maxLength={24}
                        className="pl-9 sm:pl-10 pr-8 sm:pr-10 h-10 sm:h-11 text-sm border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 rounded-lg bg-white transition-all duration-200 shadow-sm focus:shadow-lg"
                        aria-label="bénéficiaire, projet ou numéro de dossier"
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
                  devLog("Changement d'année:", value)
                  setSelectedDataYear(value)
                }}>
                  <SelectTrigger 
                    className="h-10 w-full sm:w-[160px] text-sm border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-md bg-white flex items-center justify-center [&>svg]:hidden"
                    aria-label="Sélectionner l'année des données"
                  >
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
              <TooltipProvider delayDuration={150} skipDelayDuration={0} disableHoverableContent>
                <div className="flex gap-2 flex-shrink-0">
                  {/* Menu d'export - Lazy loaded pour performance */}
                  <Dialog open={showExportDialog} onOpenChange={(open) => {
                    startTransition(() => {
                      setShowExportDialog(open)
                    })
                  }}>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isExporting || filteredSubsides.length === 0}
                              className="h-10 sm:h-9 px-3 text-sm border-gray-300 hover:bg-gray-50 rounded-md min-h-[44px] sm:min-h-0"
                              aria-label="Exporter les données filtrées"
                              onClick={() => {
                                startTransition(() => {
                                  setShowExportDialog(true)
                                })
                              }}
                            >
                              <Download className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
                            </Button>
                          </DialogTrigger>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="leading-relaxed">
                          {filteredSubsides.length === 0 
                            ? "Aucune donnée disponible" 
                            : `${filteredSubsides.length} subside${filteredSubsides.length > 1 ? 's' : ''} • CSV, Excel, JSON, PDF`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    {showExportDialog && (
                      <Suspense fallback={
                        <div className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white rounded-lg border shadow-lg fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
                          <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      }>
                        <ExportDialog
                          filteredSubsides={filteredSubsides}
                          selectedColumns={selectedColumns}
                          onColumnToggle={handleColumnToggle}
                          onSelectAllColumns={handleSelectAllColumns}
                          onExport={handleExport}
                          isExporting={isExporting}
                        />
                      </Suspense>
                    )}
                  </Dialog>

                  {/* Menu de partage - Lazy loaded pour performance */}
                  <Dialog open={showShareDialog} onOpenChange={(open) => {
                    startTransition(() => {
                      setShowShareDialog(open)
                    })
                  }}>
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 sm:h-9 px-3 text-sm border-gray-300 hover:bg-gray-50 rounded-md min-h-[44px] sm:min-h-0"
                              aria-label="Partager cette application"
                              onClick={() => {
                                startTransition(() => {
                                  setShowShareDialog(true)
                                })
                              }}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={5}>
                        <p className="leading-relaxed">Partager cette vue • Twitter, LinkedIn, WhatsApp, lien</p>
                      </TooltipContent>
                    </Tooltip>
                    {showShareDialog && (
                      <Suspense fallback={
                        <div className="w-[95vw] sm:w-full max-w-md p-4 sm:p-6 bg-white rounded-lg border shadow-lg fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
                          <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="h-12 bg-gray-200 rounded"></div>
                              <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      }>
                        <ShareDialog
                          selectedDataYear={selectedDataYear}
                          searchTerm={searchTerm}
                          onCopyLink={handleCopyLink}
                        />
                      </Suspense>
                    )}
                  </Dialog>
                </div>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        {/* Liste des subsides - Design compact avec dégradés */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-200 to-blue-200 text-gray-800 rounded-t-lg px-3 sm:px-4 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle 
                  className="text-1xl sm:text-2xl md:text-3xl font-light bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent"
                  style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}
                >
                  Liste des subsides
                </CardTitle>
                {/* Afficher les totaux : filtrés si recherche active, sinon total global */}
                {searchTerm ? (
                  // Totaux filtrés quand il y a une recherche
                  filteredTotalSubsides > 0 && (
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {formatNumberWithSpaces(filteredTotalSubsides)} subside{filteredTotalSubsides > 1 ? 's' : ''} • {formatNumberWithSpaces(Math.round(filteredTotalMontant))} €
                    </p>
                  )
                ) : (
                  // Total global quand pas de recherche
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {formatNumberWithSpaces(TOTAL_SUBSIDES)} subside{TOTAL_SUBSIDES > 1 ? 's' : ''} • {formatNumberWithSpaces(TOTAL_MONTANT)} €
                  </p>
                )}
                <CardDescription className="text-xs text-gray-700 hidden sm:block">Cliquez pour les détails</CardDescription>
              </div>
              {/* Mini-graphique d'évolution */}
              {evolutionData.length > 1 && (
                <div className="flex items-center justify-end sm:justify-start flex-shrink-0">
                  <Suspense fallback={<div className="h-12 bg-gray-100 animate-pulse rounded w-[200px] sm:w-[400px]" />}>
                    <MiniEvolutionChart 
                      data={evolutionData}
                      height={50}
                      className="w-[200px] sm:w-[400px]"
                    />
                  </Suspense>
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
                  
                const dialogKey = `${subside.nom_de_la_subvention_naam_van_de_subsidie}-${subside.beneficiaire_begunstigde}-${subside.article_complet_volledig_artikel}-${index}`
                const isDialogOpen = openDialogIndex === index
                
                return (
                <Dialog 
                  key={dialogKey}
                  open={isDialogOpen}
                  onOpenChange={(open) => {
                    setOpenDialogIndex(open ? index : null)
                  }}
                >
                  <DialogTrigger asChild>
                    <div className={`border-2 rounded-lg p-2.5 sm:p-3 hover:shadow-lg cursor-pointer transition-all bg-white/90 backdrop-blur-sm ${colorScheme.border} ${colorScheme.hoverBorder} ${colorScheme.hoverBg}`}>
                      
                      {/* Nom du bénéficiaire avec badge de relation */}
                      <div className="flex items-start gap-1.5 mb-1.5 sm:mb-2">
                        <h3 
                          className="font-semibold text-xs sm:text-sm text-blue-900 line-clamp-1 flex-1"
                          title={subside.beneficiaire_begunstigde}
                        >
                          {subside.beneficiaire_begunstigde}
                        </h3>
                        {organizationRelationships.has(subside.beneficiaire_begunstigde) && (
                          <div 
                            className="flex-shrink-0 mt-0.5"
                            title={`Relation détectée avec ${organizationRelationships.get(subside.beneficiaire_begunstigde)!.map(r => r.targetOrg).join(', ')}`}
                          >
                            <Link2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 hover:text-blue-700" />
                          </div>
                        )}
                      </div>
                      
                      {/* Montant - Plus discret, sans Badge */}
                      <div className="mb-1.5 sm:mb-2">
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">
                          {formatNumberWithSpaces(subside.montant_octroye_toegekend_bedrag)}&nbsp;€
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
                      <DialogHeader className="space-y-1 sm:space-y-2 pt-2 sm:pt-3">
                        <DialogTitle className="text-sm sm:text-base text-blue-900 font-light line-clamp-2" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Fermer le Dialog
                              setOpenDialogIndex(null)
                              // Appliquer le filtre de recherche
                              setSearchTerm(subside.beneficiaire_begunstigde)
                            }}
                            className="text-left break-words text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                            title={`Voir tous les subsides de ${subside.beneficiaire_begunstigde}`}
                          >
                            {subside.beneficiaire_begunstigde}
                          </button>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          Détails du subside pour {subside.beneficiaire_begunstigde} en {year}
                        </DialogDescription>
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
                            <h4 className={`font-light text-sm sm:text-base mb-2 sm:mb-3 ${colorScheme.text}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
                              Liens externes
                            </h4>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-200 rounded-md px-2 sm:px-2.5 py-1.5 sm:py-1.5 h-auto text-xs sm:text-xs font-medium"
                                  aria-label={`Ouvrir le registre KBO pour ${subside.beneficiaire_begunstigde} dans un nouvel onglet`}
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span>KBO</span>
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
                                className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow transition-all duration-200 rounded-md px-2 sm:px-2.5 py-1.5 sm:py-1.5 h-auto text-xs sm:text-xs font-medium"
                                aria-label={`Rechercher ${subside.beneficiaire_begunstigde} sur North Data dans un nouvel onglet`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>North Data</span>
                        </Button>
                          </>
                        )}
                        <Button
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(subside.beneficiaire_begunstigde + ' Bruxelles subside')}`, '_blank')}
                                className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow transition-all duration-200 rounded-md px-2 sm:px-2.5 py-1.5 sm:py-1.5 h-auto text-xs sm:text-xs font-medium"
                                aria-label={`Rechercher ${subside.beneficiaire_begunstigde} sur Google dans un nouvel onglet`}
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Google</span>
                        </Button>
                        <Button
                          onClick={() => {
                            // Utilise source_url_open_data si disponible, sinon utilise l'URL par défaut (cohérent avec l'export)
                            const openDataUrl = subside.source_url_open_data || 'https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score'
                            window.open(openDataUrl, '_blank')
                          }}
                                className="flex items-center justify-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 hover:border-violet-300 shadow-sm hover:shadow transition-all duration-200 rounded-md px-2 sm:px-2.5 py-1.5 sm:py-1.5 h-auto text-xs sm:text-xs font-medium"
                                aria-label="Ouvrir la source de données Open Data Brussels dans un nouvel onglet"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Source</span>
                        </Button>
                      </div>
                    </div>

                          <div className="space-y-4 sm:space-y-6">
                            {/* Informations financières */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className={`font-light text-sm sm:text-base ${colorScheme.text}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
                                Informations financières
                              </h4>
                              <div className={`grid gap-3 sm:gap-4 ${subside.montant_octroye_toegekend_bedrag === subside.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Montant octroyé</h5>
                                <p className={`text-lg sm:text-xl md:text-2xl font-bold ${colorScheme.text}`}>
                            {formatNumberWithSpaces(subside.montant_octroye_toegekend_bedrag)}&nbsp;€
                          </p>
                        </div>
                              {subside.montant_octroye_toegekend_bedrag !== subside.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 && (
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                  <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Montant prévu au budget</h5>
                                  <p className={`text-base sm:text-lg font-semibold ${colorScheme.text}`}>
                              {formatNumberWithSpaces(subside.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023)}&nbsp;€
                            </p>
                          </div>
                              )}
                        </div>
                      </div>

                            {/* Informations projet */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className={`font-light text-sm sm:text-base ${colorScheme.text}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
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
                              <h4 className={`font-light text-sm sm:text-base ${colorScheme.text}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
                                Informations administratives
                              </h4>
                              <div className={`bg-white rounded-lg p-3 sm:p-4 border ${colorScheme.border} shadow-sm`}>
                                <h5 className="font-medium text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">N° de dossier</h5>
                            <p className={`font-mono text-sm sm:text-base ${colorScheme.text} font-semibold`}>{subside.article_complet_volledig_artikel}</p>
                          </div>
                      </div>

                            {/* Relations avec d'autres organisations */}
                            {organizationRelationships.has(subside.beneficiaire_begunstigde) && (
                              <div className="space-y-2 sm:space-y-3">
                                <h4 className={`font-light text-sm sm:text-base ${colorScheme.text}`} style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
                                  Relations détectées
                                </h4>
                                <div className={`bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 shadow-sm space-y-3`}>
                                  {organizationRelationships.get(subside.beneficiaire_begunstigde)!.map((rel, relIndex) => (
                                    <div key={relIndex} className="border-b border-blue-200 last:border-b-0 pb-3 last:pb-0">
                                      <div className="flex items-start gap-2 mb-2">
                                        <Link2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setOpenDialogIndex(null)
                                              setSearchTerm(rel.targetOrg)
                                            }}
                                            className="text-sm sm:text-base font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer transition-colors text-left"
                                          >
                                            {rel.targetOrg}
                                          </button>
                                          <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-700">
                                              {Math.round(rel.confidence * 100)}% confiance
                                            </Badge>
                                            <span className="text-xs text-gray-600">
                                              {rel.mentionCount} mention{rel.mentionCount > 1 ? 's' : ''} • {rel.years.join(', ')}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      {rel.contexts.length > 0 && (
                                        <div className="mt-2 pl-6 space-y-1">
                                          <p className="text-xs font-medium text-gray-600 mb-1">Contexte :</p>
                                          {rel.contexts.slice(0, 2).map((context, ctxIndex) => (
                                            <div key={ctxIndex} className="text-xs text-gray-700 bg-white rounded p-2 border border-gray-200">
                                              <p className="line-clamp-2">{context.objet}</p>
                                              <p className="text-[10px] text-gray-500 mt-1">{context.annee} • {formatNumberWithSpaces(context.montant)} €</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
                {/* Version simplifiée pour mobile */}
                <div className="flex items-center gap-1 sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="min-h-[44px] px-2"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant={currentPage === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    className={`min-h-[44px] px-3 ${currentPage === 1 ? "text-gray-800 font-medium" : ""}`}
                    style={currentPage === 1 ? {
                      backgroundColor: '#A7F3D0',
                      borderColor: '#6EE7B7',
                    } : undefined}
                    aria-label="Aller à la page 1"
                    aria-current={currentPage === 1 ? 'page' : undefined}
                  >
                    1
                  </Button>

                  {totalPages > 1 && (
                    <>
                      {currentPage > 2 && totalPages > 2 && (
                        <span className="px-1 text-gray-500">...</span>
                      )}
                      
                      {currentPage !== 1 && currentPage !== totalPages && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage)}
                          className="min-h-[44px] px-3 text-gray-800 font-medium"
                          style={{
                            backgroundColor: '#A7F3D0',
                            borderColor: '#6EE7B7',
                          }}
                          aria-label={`Page ${currentPage}`}
                          aria-current="page"
                        >
                          {currentPage}
                        </Button>
                      )}

                      {currentPage < totalPages - 1 && totalPages > 2 && (
                        <span className="px-1 text-gray-500">...</span>
                      )}

                      {totalPages > 1 && (
                        <Button
                          variant={currentPage === totalPages ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className={`min-h-[44px] px-3 ${currentPage === totalPages ? "text-gray-800 font-medium" : ""}`}
                          style={currentPage === totalPages ? {
                            backgroundColor: '#A7F3D0',
                            borderColor: '#6EE7B7',
                          } : undefined}
                          aria-label={`Aller à la page ${totalPages}`}
                          aria-current={currentPage === totalPages ? 'page' : undefined}
                        >
                          {totalPages}
                        </Button>
                      )}
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="min-h-[44px] px-2"
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Version complète pour desktop */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="min-h-0"
                    aria-label="Aller à la page précédente"
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
                          className={`min-h-0 ${currentPage === page ? "text-gray-800 font-medium" : ""}`}
                          style={currentPage === page ? {
                            backgroundColor: '#A7F3D0', // Pastel vert menthe
                            borderColor: '#6EE7B7',
                          } : undefined}
                          aria-label={typeof page === 'number' ? `Aller à la page ${page}` : undefined}
                          aria-current={currentPage === page ? 'page' : undefined}
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
                    className="min-h-0"
                    aria-label="Aller à la page suivante"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer avec compteur de visite et radars */}
      <AppFooter />
    </div>
  )
}
