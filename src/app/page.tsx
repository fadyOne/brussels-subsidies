"use client"
// import { LanguageSelector } from "@/components/LanguageSelector" // ❌ Supprimé temporairement
import { LoadingScreen } from "@/components/LoadingScreen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { useTranslation } from "@/lib/LanguageContext" // ❌ Supprimé temporairement
import { AlertCircle, Building, Calendar, FileText, Filter, RefreshCw, Search, Share2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface Subside {
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

// Fonction pour catégoriser les subsides
function categorizeSubside(objet: string): string {
  const obj = objet.toLowerCase()
  
  // Sport
  if (obj.includes('sport') || obj.includes('football') || obj.includes('basketball') || 
      obj.includes('natation') || obj.includes('judo') || obj.includes('tennis') || 
      obj.includes('padel') || obj.includes('course') || obj.includes('athlétisme') ||
      obj.includes('cyclisme') || obj.includes('rugby') || obj.includes('volley') ||
      obj.includes('boxing') || obj.includes('karate') || obj.includes('taekwondo') ||
      obj.includes('hockey') || obj.includes('pétanque') || obj.includes('diving') ||
      obj.includes('synchro') || obj.includes('futsal') || obj.includes('gym')) {
    return 'Sport'
  }
  
  // Culture
  if (obj.includes('festival') || obj.includes('musique') || obj.includes('jazz') || 
      obj.includes('théâtre') || obj.includes('culture') || obj.includes('art') || 
      obj.includes('exposition') || obj.includes('concert') || obj.includes('danse') ||
      obj.includes('littérature') || obj.includes('cinéma') || obj.includes('spectacle') ||
      obj.includes('film') || obj.includes('cinémathèque') || obj.includes('bibliothèque') ||
      obj.includes('musée') || obj.includes('ommegang') || obj.includes('briff') ||
      obj.includes('bsff') || obj.includes('lumières') || obj.includes('woodblocks') ||
      obj.includes('midis') || obj.includes('minimes') || obj.includes('musicorum')) {
    return 'Culture'
  }
  
  // Social
  if (obj.includes('social') || obj.includes('égalité') || obj.includes('chances') || 
      obj.includes('handicap') || obj.includes('seniors') || obj.includes('jeunesse') || 
      obj.includes('famille') || obj.includes('solidarité') || obj.includes('insertion') ||
      obj.includes('prévention') || obj.includes('aide') || obj.includes('accompagnement') ||
      obj.includes('pride') || obj.includes('lgbt') || obj.includes('rainbow') ||
      obj.includes('droits') || obj.includes('femmes') || obj.includes('braderies') ||
      obj.includes('sécurité') || obj.includes('oeuvres') || obj.includes('sociaux')) {
    return 'Social'
  }
  
  // Environnement
  if (obj.includes('environnement') || obj.includes('climat') || obj.includes('biodiversité') || 
      obj.includes('vert') || obj.includes('nature') || obj.includes('écologie') ||
      obj.includes('développement durable') || obj.includes('énergie') || obj.includes('recyclage') ||
      obj.includes('earth') || obj.includes('hour') || obj.includes('alimentation') ||
      obj.includes('durable') || obj.includes('insectes') || obj.includes('hôtels') ||
      obj.includes('vaisselle') || obj.includes('réemployable') || obj.includes('herbruikbaar')) {
    return 'Environnement'
  }
  
  // Éducation
  if (obj.includes('école') || obj.includes('éducation') || obj.includes('formation') || 
      obj.includes('apprentissage') || obj.includes('enseignement') || obj.includes('pédagogie') ||
      obj.includes('étudiant') || obj.includes('université') || obj.includes('recherche') ||
      obj.includes('scientifique') || obj.includes('devoirs') || obj.includes('vormingen') ||
      obj.includes('vsd') || obj.includes('opleiding') || obj.includes('vélo') ||
      obj.includes('fietsevenementen') || obj.includes('pairs') || obj.includes('sexuelle')) {
    return 'Éducation'
  }
  
  // Santé
  if (obj.includes('santé') || obj.includes('hôpital') || obj.includes('médical') || 
      obj.includes('soins') || obj.includes('bien-être') || obj.includes('médecine') ||
      obj.includes('pharmacie') || obj.includes('psychologie') || obj.includes('mental') ||
      obj.includes('repos') || obj.includes('verzorging') || obj.includes('schuldenlast')) {
    return 'Santé'
  }
  
  // Économie
  if (obj.includes('économie') || obj.includes('emploi') || obj.includes('entreprise') || 
      obj.includes('développement économique') || obj.includes('innovation') || obj.includes('startup') ||
      obj.includes('commerce') || obj.includes('tourisme') || obj.includes('made') ||
      obj.includes('versailles') || obj.includes('congrès') || obj.includes('mini-entreprises') ||
      obj.includes('promotion') || obj.includes('toerisme')) {
    return 'Économie'
  }
  
  // Quartier/Urbanisme
  if (obj.includes('quartier') || obj.includes('contrat') || obj.includes('urbanisme') || 
      obj.includes('logement') || obj.includes('infrastructure') || obj.includes('mobilité') ||
      obj.includes('durable') || obj.includes('rénovation') || obj.includes('urbaine') ||
      obj.includes('balades') || obj.includes('urbaines') || obj.includes('littéraires') ||
      obj.includes('plaisirs') || obj.includes('hiver') || obj.includes('winterpret')) {
    return 'Quartier & Urbanisme'
  }
  
  // Fonctionnement général
  if (obj.includes('fonctionnement') || obj.includes('werkingskosten') || obj.includes('cotisation') ||
      obj.includes('bijdrage') || obj.includes('membre') || obj.includes('association') ||
      obj.includes('primes') || obj.includes('syndicales') || obj.includes('vakbondspremies') ||
      obj.includes('annuelle') || obj.includes('jaarlijkse') || obj.includes('lidmaatschapsbijdrage')) {
    return 'Fonctionnement'
  }
  
  return 'Autre'
}

export default function SubsidesDashboard() {
  // const { t } = useTranslation() // ❌ Supprimé temporairement
  const [subsides, setSubsides] = useState<Subside[]>([])
  const [filteredSubsides, setFilteredSubsides] = useState<Subside[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDataYear, setSelectedDataYear] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedCommune, setSelectedCommune] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  // const [showShareDialog, setShowShareDialog] = useState(false) // ❌ Supprimé - non utilisé

  // Fonction pour détecter automatiquement les années disponibles
  const getAvailableYears = useCallback(async (): Promise<string[]> => {
    try {
      // Liste des années possibles (étendue pour couvrir plus de cas)
      const possibleYears = ["2030", "2029", "2028", "2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"]
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
        const year = urlParams.get('year')
        const category = urlParams.get('category')
        const search = urlParams.get('search')
        
        if (year) setSelectedDataYear(year)
        if (category) setSelectedCategory(category)
        if (search) setSearchTerm(search)
      }
      
      const detectedYears = await getAvailableYears()
      setAvailableDataYears(detectedYears)
      console.log("📅 Années détectées:", detectedYears)
    }
    detectYears()
  }, [getAvailableYears])

  // Fonction pour gérer le clic sur un bénéficiaire (simplifiée)
  const handleBeneficiaryClick = useCallback((beneficiaryName: string) => {
    // Pour l'instant, juste un console.log - peut être étendu plus tard
    console.log('Bénéficiaire cliqué:', beneficiaryName)
  }, [])

  // Fonction pour gérer le clic sur un secteur dans la légende
  const handleSectorClick = useCallback((sectorName: string) => {
    // Extraire les mots clés les plus courts pour une meilleure recherche
    let searchTerm = sectorName.toLowerCase()
    
    // Mapping des catégories vers des termes de recherche plus courts
    const searchMapping: { [key: string]: string } = {
      'brussels major events (bme)': 'bme',
      'bravvo bruxelles avance': 'bravvo',
      'services de police': 'police',
      'action sociale': 'action sociale',
      'santé & hôpitaux': 'hôpital',
      'enseignement & formation': 'enseignement',
      'culture & patrimoine': 'culture',
      'sport & loisirs': 'sport',
      'économie & commerce': 'économie',
      'autorités & institutions': 'autorités',
      'événements & festivals': 'festival',
      'services sociaux & cpas': 'cpas',
      'alimentation & restauration': 'cuisines'
    }
    
    // Utiliser le mapping si disponible, sinon prendre le premier mot significatif
    if (searchMapping[searchTerm]) {
      searchTerm = searchMapping[searchTerm]
    } else {
      // Extraire le premier mot significatif (ignorer les articles)
      const words = searchTerm.split(' ')
      const significantWords = words.filter(word => 
        word.length > 2 && 
        !['les', 'des', 'du', 'de', 'la', 'le', 'et', '&'].includes(word)
      )
      searchTerm = significantWords[0] || words[0]
    }
    
    console.log(`🔍 Clic sur secteur: "${sectorName}" → recherche: "${searchTerm}"`)
    setSearchTerm(searchTerm)
    
    // Remonter en haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
              const normalizedData: Subside[] = rawData.map((item: unknown) => {
                const data = item as Record<string, unknown>
                
                // Gérer les différents noms de champs selon l'année
                const beneficiaire = String(
                  data.beneficiaire_begunstigde || 
                  data.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
                  "Non spécifié"
                )
                
                const article = String(
                  data.article_complet_volledig_artikel || 
                  data.article_budgetaire_begrotingsartikel || 
                  "Non spécifié"
                )
                
                const objet = String(
                  data.l_objet_de_la_subvention_doel_van_de_subsidie || 
                  data.objet_du_subside_doel_van_de_subsidie || 
                  "Non spécifié"
                )
                
                const nomSubside = String(
                  data.nom_de_la_subvention_naam_van_de_subsidie || 
                  data.nom_du_subside_naam_subsidie || 
                  "Non spécifié"
                )
                
                const parseAmount = (value: unknown): number => {
                  if (typeof value === 'number') return value
                  if (typeof value === 'string') {
                    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
                  }
                  return 0
                }
                
                // Gérer les différents champs de montant selon l'année
                const montant = parseAmount(
                  data.montant_octroye_toegekend_bedrag || 
                  data.budget_2019_begroting_2019
                )
                
                const montantPrevu = parseAmount(
                  data.montant_prevu_au_budget_2020_bedrag_voorzien_op_begroting_2020 ||
                  data.montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021 ||
                  data.montant_prevu_au_budget_2022_bedrag_voorzien_op_begroting_2022 ||
                  data.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 ||
                  data.montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024 ||
                  data.budget_2019_begroting_2019
                )

                // Gérer les différents champs d'année
                const anneeDebut = String(
                  data.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend ||
                  data.annee_budgetaire_debut_octroi_begroting_jaar_begin_toekenning ||
                  year
                )
                
                const anneeFin = String(
                  data.l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend ||
                  data.annee_budgetaire_fin_octroi_begroting_jaar_einde_van_toekenning ||
                  (parseInt(year) + 1).toString()
                )

                return {
                  nom_de_la_subvention_naam_van_de_subsidie: nomSubside,
                  article_complet_volledig_artikel: article,
                  beneficiaire_begunstigde: beneficiaire,
                  le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie ? String(data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie) : (data.numero_bce_kbo_nummer ? String(data.numero_bce_kbo_nummer) : null),
                  l_objet_de_la_subvention_doel_van_de_subsidie: objet,
                  montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023: montantPrevu,
                  montant_octroye_toegekend_bedrag: montant,
                  l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: anneeDebut,
                  l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: anneeFin,
                  // Champs pour compatibilité
                  nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
                  article_budgetaire_begrotingsartikel: article,
                  montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021: String(montantPrevu),
                }
              })
              
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
          const normalizedData: Subside[] = rawData.map((item: unknown) => {
            const data = item as Record<string, unknown>
            
            // Gérer les différents noms de champs selon l'année
            const beneficiaire = String(
              data.beneficiaire_begunstigde || 
              data.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
              "Non spécifié"
            )
            
            const article = String(
              data.article_complet_volledig_artikel || 
              data.article_budgetaire_begrotingsartikel || 
              "Non spécifié"
            )
            
            const objet = String(
              data.l_objet_de_la_subvention_doel_van_de_subsidie || 
              data.objet_du_subside_doel_van_de_subsidie || 
              "Non spécifié"
            )
            
            const nomSubside = String(
              data.nom_de_la_subvention_naam_van_de_subsidie || 
              data.nom_du_subside_naam_subsidie || 
              "Non spécifié"
            )
            
            const parseAmount = (value: unknown): number => {
              if (typeof value === 'number') return value
              if (typeof value === 'string') {
                return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0
              }
              return 0
            }
            
            // Gérer les différents champs de montant selon l'année
            const montant = parseAmount(
              data.montant_octroye_toegekend_bedrag || 
              data.budget_2019_begroting_2019
            )
            
            const montantPrevu = parseAmount(
              data.montant_prevu_au_budget_2020_bedrag_voorzien_op_begroting_2020 ||
              data.montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021 ||
              data.montant_prevu_au_budget_2022_bedrag_voorzien_op_begroting_2022 ||
              data.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 ||
              data.montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024 ||
              data.budget_2019_begroting_2019
            )

            // Gérer les différents champs d'année
            const anneeDebut = String(
              data.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend ||
              data.annee_budgetaire_debut_octroi_begroting_jaar_begin_toekenning ||
              dataYear
            )
            
            const anneeFin = String(
              data.l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend ||
              data.annee_budgetaire_fin_octroi_begroting_jaar_einde_van_toekenning ||
              (parseInt(dataYear) + 1).toString()
            )

            return {
              nom_de_la_subvention_naam_van_de_subsidie: nomSubside,
              article_complet_volledig_artikel: article,
              beneficiaire_begunstigde: beneficiaire,
              le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie ? String(data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie) : (data.numero_bce_kbo_nummer ? String(data.numero_bce_kbo_nummer) : null),
              l_objet_de_la_subvention_doel_van_de_subsidie: objet,
              montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023: montantPrevu,
              montant_octroye_toegekend_bedrag: montant,
              l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: anneeDebut,
              l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: anneeFin,
              // Champs pour compatibilité
              nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
              article_budgetaire_begrotingsartikel: article,
              montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021: String(montantPrevu),
            }
          })

          allData = normalizedData
          console.log(`${normalizedData.length} subsides ${dataYear} chargés avec succès`)
      } else {
          throw new Error(`Aucune donnée récupérée depuis le fichier data-${dataYear}.json`)
      }
      }

      setSubsides(allData)
      setFilteredSubsides(allData)
      
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
  }, [selectedDataYear]) // ✅ Retirer loadData de la dépendance

  // Filtrage des données avec debounce pour optimiser la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    let filtered = subsides

    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (s) =>
            s.beneficiaire_begunstigde.toLowerCase().includes(searchLower) ||
            s.l_objet_de_la_subvention_doel_van_de_subsidie.toLowerCase().includes(searchLower) ||
            s.article_complet_volledig_artikel.toLowerCase().includes(searchLower) ||
            s.nom_de_la_subvention_naam_van_de_subsidie.toLowerCase().includes(searchLower)
        )
      }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (s) => categorizeSubside(s.l_objet_de_la_subvention_doel_van_de_subsidie) === selectedCategory,
      )
    }

    if (selectedCommune !== "all") {
      filtered = filtered.filter(
        (s) => s.beneficiaire_begunstigde === selectedCommune,
      )
    }

    setFilteredSubsides(filtered)
    setCurrentPage(1)
    }, 300) // Debounce de 300ms pour éviter trop de recalculs

    return () => clearTimeout(timeoutId)
  }, [subsides, searchTerm, selectedCategory, selectedCommune])

  // Pagination
  const totalPages = Math.ceil(filteredSubsides.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSubsides = filteredSubsides.slice(startIndex, startIndex + itemsPerPage)

  // Données pour les graphiques
  const categoryData = filteredSubsides.reduce(
    (acc, subside) => {
      const category = categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)
      const existing = acc.find((item) => item.name === category)
      if (existing) {
        existing.value += subside.montant_octroye_toegekend_bedrag
        existing.count += 1
      } else {
        acc.push({
          name: category,
          value: subside.montant_octroye_toegekend_bedrag,
          count: 1,
        })
      }
      return acc
    },
    [] as { name: string; value: number; count: number }[],
  )

      // Fonction pour catégoriser les bénéficiaires
  const categorizeBeneficiary = (name: string): string | null => {
    const lowerName = name.toLowerCase()
    
    // Catégories spécifiques en priorité (ordre de spécificité décroissante)
    
    // 1. BME - très spécifique
    if (lowerName.includes('brussels major events') || lowerName.includes('bme')) {
      return 'Brussels Major Events (BME)'
    }
    
    // 2. Bravvo - très spécifique
    if (lowerName.includes('bravvo') || lowerName.includes('bruxelles avance') || lowerName.includes('brussel vooruit')) {
      return 'Bravvo Bruxelles Avance'
    }
    
    // 3. Organisations spécifiques
    if (lowerName.includes('schola') || lowerName.includes('bruxelles enseignement')) {
      return 'Enseignement & Formation'
    }
    if (lowerName.includes('centre public') || lowerName.includes('cpas')) {
      return 'Services Sociaux & CPAS'
    }
    if (lowerName.includes('bruxelles musées') || lowerName.includes('musées') || lowerName.includes('musea') ||
        lowerName.includes('centre culturel') || lowerName.includes('bruegel')) {
      return 'Culture & Patrimoine'
    }
    if (lowerName.includes('brufête') || lowerName.includes('brufeest') || lowerName.includes('visit.brussels')) {
      return 'Événements & Festivals'
    }
    if (lowerName.includes('conférence des bourgmestres') || lowerName.includes('vergadering der burgemeesters')) {
      return 'Autorités & Institutions'
    }
    if (lowerName.includes('cuisines') || lowerName.includes('keukens')) {
      return 'Alimentation & Restauration'
    }
    
    // 4. Catégories générales (ordre de priorité)
    if (lowerName.includes('police') || lowerName.includes('politie')) {
      return 'Services de Police'
    }
    if (lowerName.includes('action sociale') || lowerName.includes('maatschappelijk welzijn') || lowerName.includes('picol')) {
      return 'Action Sociale'
    }
    if (lowerName.includes('hôpital') || lowerName.includes('hospitalier') || lowerName.includes('ziekenhuis')) {
      return 'Santé & Hôpitaux'
    }
    if (lowerName.includes('enseignement') || lowerName.includes('école') || lowerName.includes('school') || lowerName.includes('formation')) {
      return 'Enseignement & Formation'
    }
    if (lowerName.includes('culture') || lowerName.includes('événement') || lowerName.includes('event') || lowerName.includes('création')) {
      return 'Culture & Patrimoine'
    }
    if (lowerName.includes('sport') || lowerName.includes('bains') || lowerName.includes('zwem')) {
      return 'Sport & Loisirs'
    }
    if (lowerName.includes('économie') || lowerName.includes('commerce') || lowerName.includes('entreprise') || lowerName.includes('ondernemen')) {
      return 'Économie & Commerce'
    }
    if (lowerName.includes('office national') || lowerName.includes('rijksdienst') || lowerName.includes('autorités') || lowerName.includes('overheden')) {
      return 'Autorités & Institutions'
    }
    if (lowerName.includes('maison de') || lowerName.includes('centre d\'animation') || lowerName.includes('espace cultures')) {
      return 'Centres Culturels & Maisons'
    }
    if (lowerName.includes('rock the city') || lowerName.includes('jazz projects') || lowerName.includes('productions associées')) {
      return 'Événements & Festivals'
    }
    if (lowerName.includes('intégration') || lowerName.includes('cohabitation')) {
      return 'Services Sociaux & CPAS'
    }
    if (lowerName.includes('expositions') || lowerName.includes('tentoonstellingen')) {
      return 'Musées & Expositions'
    }
    if (lowerName.includes('restaurant') || lowerName.includes('alimentation') || lowerName.includes('food')) {
      return 'Alimentation & Restauration'
    }
    
    // Ne pas inclure dans le camembert si pas de catégorie claire
    return null
  }

  // Données pour le camembert des catégories de bénéficiaires (basé sur toutes les données, pas filtrées)
  const topBeneficiariesData = subsides.reduce(
      (acc, subside) => {
      const category = categorizeBeneficiary(subside.beneficiaire_begunstigde)
      
      // Ignorer les catégories null (anciennement "Autres")
      if (!category) {
        return acc
      }
      
      // Debug temporaire pour vérifier les catégorisations
      if (subside.beneficiaire_begunstigde && subside.beneficiaire_begunstigde.toLowerCase().includes('bravvo')) {
        console.log(`🔍 Bravvo détecté: "${subside.beneficiaire_begunstigde}" → "${category}"`)
      }
      
      const existing = acc.find((item) => item.name === category)
        if (existing) {
          existing.value += subside.montant_octroye_toegekend_bedrag
        existing.count += 1
        } else {
        acc.push({
          name: category,
          value: subside.montant_octroye_toegekend_bedrag,
          count: 1,
        })
        }
        return acc
      },
    [] as { name: string; value: number; count: number }[],
  )
    .sort((a, b) => b.value - a.value) // Trier par montant décroissant
    .map((item, index) => ({
      ...item,
      color: [
        '#FBBF24', // Jaune
        '#06B6D4', // Cyan
        '#10B981', // Émeraude
        '#F59E0B', // Ambre
        '#EF4444', // Rouge
        '#3B82F6', // Bleu
        '#EC4899', // Rose
        '#84CC16', // Lime
        '#F97316', // Orange
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F472B6', // Pink
        '#A78BFA', // Purple
        '#34D399', // Emerald
        '#FBBF24', // Yellow
        '#FB7185', // Rose
        '#60A5FA', // Light Blue
        '#A3E635', // Lime
      ][index] || '#6B7280' // Gris par défaut
    }))

  // const communeData = filteredSubsides // ❌ Supprimé - non utilisé
  //   .reduce(
  //     (acc, subside) => {
  //       const existing = acc.find((item) => item.name === subside.beneficiaire_begunstigde)
  //       if (existing) {
  //         existing.value += subside.montant_octroye_toegekend_bedrag
  //       } else {
  //         acc.push({ name: subside.beneficiaire_begunstigde, value: subside.montant_octroye_toegekend_bedrag })
  //       }
  //       return acc
  //     },
  //     [] as { name: string; value: number }[],
  //   )
  //   .sort((a, b) => b.value - a.value)
  //   .slice(0, 10)

  const yearData = filteredSubsides
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

  // Calcul des totaux avec useMemo pour s'assurer qu'ils sont recalculés
  const totalMontant = useMemo(() => {
    // Utiliser filteredSubsides s'il y en a, sinon toutes les données
    const dataToUse = filteredSubsides.length > 0 ? filteredSubsides : subsides
    // Calculer le total de TOUS les subsides filtrés, pas seulement ceux avec une catégorie
    return dataToUse.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  }, [filteredSubsides, subsides])

  // Calcul de la plage d'années dynamique
  const yearRange = useMemo(() => {
    const dataToUse = filteredSubsides.length > 0 ? filteredSubsides : subsides
    if (dataToUse.length === 0) return ""

    const years = dataToUse.map(s => s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
      .filter(year => year && year !== "Non spécifié")
      .map(year => parseInt(year))
      .filter(year => !isNaN(year))
      .sort((a, b) => a - b)

    if (years.length === 0) return ""
    
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    
    if (minYear === maxYear) {
      return `(${minYear})`
    } else {
      return `(${minYear}-${maxYear})`
    }
  }, [filteredSubsides, subsides])

  // Total pour le camembert (basé sur toutes les données)
  const totalMontantCamembert = useMemo(() => {
    return subsides
      .filter(s => categorizeBeneficiary(s.beneficiaire_begunstigde) !== null)
      .reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  }, [subsides])
  
  const totalSubsides = useMemo(() => {
    return filteredSubsides.length
  }, [filteredSubsides])
  const uniqueCategories = [...new Set(subsides.map((s) => categorizeSubside(s.l_objet_de_la_subvention_doel_van_de_subsidie)))]
  // const uniqueCommunes = [...new Set(subsides.map((s) => s.beneficiaire_begunstigde).filter(Boolean))] // ❌ Supprimé - non utilisé

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
      
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        {/* Header avec gradient pastel */}
        <div className="text-center px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-600 bg-clip-text text-transparent">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Subsides Bruxelles</h1>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-gray-700 mb-4">
            Données officielles - {totalSubsides} subsides
          </p>
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6 inline-block">
            <p className="text-2xl sm:text-3xl font-bold text-blue-800">
              {totalMontant.toLocaleString()} €
            </p>
            <p className="text-sm text-blue-600 font-medium">
              Montant total {yearRange}
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-gray-700 border-0 px-4 py-2 text-sm">
              {selectedDataYear === "all" ? "Toutes les années" : `Données ${selectedDataYear}`} chargées
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadData(selectedDataYear)} 
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Filtres avec design pastel */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-200 to-indigo-200 text-gray-800 rounded-t-lg px-4 sm:px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Filter className="w-5 h-5 sm:w-6 sm:h-6" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Champ de recherche principal avec effet fun */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-3 block">Recherche principale</label>
              <div className="relative">
                <Search className="absolute left-4 top-4 h-6 w-6 text-blue-400 animate-pulse" />
                <Input
                  placeholder="Rechercher un bénéficiaire, un projet ou un numéro de dossier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-20 text-6xl font-black text-center border-2 border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all rounded-xl bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl tracking-wider placeholder:font-normal placeholder:text-gray-400 placeholder:opacity-70"
                  style={{
                    textShadow: searchTerm ? '2px 2px 4px rgba(59, 130, 246, 0.3)' : 'none',
                    transform: searchTerm ? 'scale(1.02)' : 'scale(1)',
                    letterSpacing: searchTerm ? '0.1em' : '0.05em',
                    color: searchTerm ? 'rgba(0,0,0,0)' : 'inherit',
                    caretColor: '#3B82F6' // Curseur bleu visible
                  }}
                />
                {searchTerm && (
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="text-6xl font-black text-blue-600 animate-pulse tracking-wider relative">
                      {searchTerm}
                      {/* Curseur visible par-dessus le texte animé */}
                      <span className="absolute right-0 top-0 w-1 h-16 bg-blue-600 animate-pulse" style={{ marginLeft: '2px' }}></span>
                    </div>
                  </div>
                )}
                
                {/* Bouton pour vider la recherche */}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Vider la recherche"
                  >
                    <svg className="w-6 h-6 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtres secondaires avec couleurs pastel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-300" />
                  Année des données
                </label>
                <Select value={selectedDataYear} onValueChange={(value) => {
                  console.log("Changement d'année:", value)
                  setSelectedDataYear(value)
                }}>
                  <SelectTrigger className="h-12 border-2 border-blue-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 rounded-xl bg-white/90">
                    <SelectValue placeholder="Sélectionner l'année" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDataYears.map((year) => (
                      <SelectItem key={`data-year-${year}`} value={year}>
                        {year === "all" ? "Toutes les années" : `Données ${year}`}
                      </SelectItem>
                    ))}
                    {availableDataYears.length === 1 && (
                      <SelectItem value="loading" disabled>
                        🔄 Détection des fichiers...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-300" />
                  Catégorie
                </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 border-2 border-indigo-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 rounded-xl bg-white/90">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {uniqueCategories.sort().map((category, index) => (
                    <SelectItem key={`category-${index}-${category}`} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Boutons d'action avec gradients pastel */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                  setSelectedCommune("all")
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-2 border-gray-200 rounded-xl transition-all"
              >
                <Filter className="w-4 h-4" />
                Réinitialiser les filtres
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(selectedDataYear)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 border-2 border-blue-200 rounded-xl transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-100 to-indigo-200 hover:from-indigo-200 hover:to-indigo-300 border-2 border-indigo-200 rounded-xl transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Partager cette vue
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
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
                    <div className="grid grid-cols-2 gap-3">
                      {/* Twitter/X */}
                      <Button
                        onClick={() => {
                          const text = "Découvrez la transparence des subsides bruxellois - Données officielles 2019-2024"
                          const url = new URL(window.location.href)
                          url.searchParams.set('year', selectedDataYear)
                          url.searchParams.set('category', selectedCategory)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url.toString())}`
                          window.open(shareUrl, '_blank')
                        }}
                        className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white"
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
                          url.searchParams.set('category', selectedCategory)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          const fullText = `Découvrez la transparence des subsides bruxellois ${url.toString()}`
                          window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(fullText)}`, '_blank')
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
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
                          url.searchParams.set('category', selectedCategory)
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
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white"
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
                          url.searchParams.set('category', selectedCategory)
                          if (searchTerm) url.searchParams.set('search', searchTerm)
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url.toString())}`, '_blank')
                        }}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white"
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
                </CardContent>
              </Card>

                {/* Liste des subsides avec design pastel */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-200 to-blue-200 text-gray-800 rounded-t-lg px-4 sm:px-6 py-4">
            <CardTitle className="text-lg sm:text-xl">Liste des subsides ({filteredSubsides.length} résultats)</CardTitle>
            <CardDescription className="text-gray-600">Cliquez sur un subside pour voir tous les détails</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {paginatedSubsides.map((subside, index) => (
                <Dialog key={`${subside.nom_de_la_subvention_naam_van_de_subsidie}-${subside.beneficiaire_begunstigde}-${subside.article_complet_volledig_artikel}-${index}`}>
                  <DialogTrigger asChild>
                    <div className="border-2 border-blue-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-lg cursor-pointer transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-blue-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <h3 
                          className="font-semibold text-lg text-blue-600 hover:text-blue-700 cursor-pointer underline flex-1 mr-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBeneficiaryClick(subside.beneficiaire_begunstigde)
                          }}
                        >
                          {subside.beneficiaire_begunstigde}
                        </h3>
                        <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-gray-700 border-0 text-lg font-bold whitespace-nowrap">
                          {subside.montant_octroye_toegekend_bedrag.toLocaleString()} €
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 text-sm line-clamp-2">{subside.nom_de_la_subvention_naam_van_de_subsidie}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-gradient-to-r from-blue-200 to-cyan-200 text-gray-700 border-0 text-xs">
                          {categorizeSubside(subside.l_objet_de_la_subvention_doel_van_de_subsidie)}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-indigo-200 to-slate-200 text-gray-700 border-0 text-xs">
                          {subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 border-0 text-xs font-mono">
                          {subside.article_complet_volledig_artikel}
                        </Badge>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {subside.beneficiaire_begunstigde}
                      </DialogTitle>
                      <DialogDescription>
                        Détails complets du subside {subside.nom_de_la_subvention_naam_van_de_subsidie}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Liens externes - En haut et colorés */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-lg mb-3 text-gray-800">🔗 Liens externes</h4>
                      <div className="flex flex-wrap gap-3">
                        {subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie && (
                          <Button
                            onClick={() => window.open(`https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie}`, '_blank')}
                            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-4 py-2"
                          >
                            <Building className="w-4 h-4" />
                            Registre KBO
                          </Button>
                        )}
                        <Button
                          onClick={() => window.open(`https://www.northdata.com/${encodeURIComponent(subside.beneficiaire_begunstigde)}`, '_blank')}
                          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-4 py-2"
                        >
                          <FileText className="w-4 h-4" />
                          North Data
                        </Button>
                        <Button
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(subside.beneficiaire_begunstigde + ' Bruxelles subside')}`, '_blank')}
                          className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-4 py-2"
                        >
                          <Search className="w-4 h-4" />
                          Google
                        </Button>
                        <Button
                          onClick={() => window.open('https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score', '_blank')}
                          className="flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 hover:border-violet-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-lg px-4 py-2"
                        >
                          <FileText className="w-4 h-4" />
                          Source Data
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Informations financières */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Informations financières</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h5 className="font-medium text-sm text-gray-600">Montant octroyé</h5>
                          <p className="text-2xl font-bold text-green-600">
                            {subside.montant_octroye_toegekend_bedrag.toLocaleString()} €
                          </p>
                        </div>
                        <div>
                            <h5 className="font-medium text-sm text-gray-600">Montant prévu au budget</h5>
                            <p className="text-lg font-semibold">
                              {subside.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023.toLocaleString()} €
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informations bénéficiaire */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Informations bénéficiaire</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">Nom</h5>
                            <p className="font-semibold">{subside.beneficiaire_begunstigde}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">Numéro BCE (KBO)</h5>
                            <p className="text-blue-600">
                              {subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie ||
                                "Non spécifié"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Informations projet */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Projet</h4>
                        <div>
                          <h5 className="font-medium text-sm text-gray-600">Nom</h5>
                          <p>{subside.nom_de_la_subvention_naam_van_de_subsidie}</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm text-gray-600">Objectif</h5>
                          <p>{subside.l_objet_de_la_subvention_doel_van_de_subsidie}</p>
                        </div>
                      </div>

                      {/* Informations administratives */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-lg">Informations administratives</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm text-gray-600">N° de dossier</h5>
                            <p className="font-mono">{subside.article_complet_volledig_artikel}</p>
                          </div>
                        </div>
                      </div>


                    </div>
                  </DialogContent>
                </Dialog>
              ))}

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
                >
                  Précédent
                </Button>

                <div className="flex gap-1">
                  {/* Pagination intelligente - affiche seulement quelques numéros */}
                  {(() => {
                    const pages = []
                    const maxVisiblePages = 5
                    
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
                        className={currentPage === page ? "bg-blue-600 text-white" : ""}
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
                >
                  Suivant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graphiques avec design pastel */}
        <Tabs defaultValue="categories" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="categories" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 transition-all"
            >
              Par catégorie
            </TabsTrigger>
            <TabsTrigger 
              value="years"
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-200 data-[state=active]:to-indigo-200 data-[state=active]:text-gray-800 transition-all"
            >
              Par année
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-200 to-cyan-200 text-gray-800 rounded-t-lg px-6 py-4">
                  <CardTitle className="text-lg">Répartition par catégorie (montants)</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      value: {
                        label: "Montant",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[350px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) => {
                            // Afficher seulement les labels pour les tranches > 3%
                            if (percent && percent > 0.03) {
                              return `${name}\n${(percent * 100).toFixed(0)}%`
                            }
                            return ""
                          }}
                          outerRadius={80}
                          innerRadius={20}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${Number(value).toLocaleString()} €`, 
                            props.payload.name
                          ]}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: '#374151', fontSize: '12px' }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  </CardContent>
                </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-200 to-slate-200 text-gray-800 rounded-t-lg px-6 py-4">
                  <CardTitle className="text-lg">Nombre de subsides par catégorie</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: "Nombre",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 11, fill: '#6B7280' }}
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${Number(value).toLocaleString()} subsides`, 
                            props.payload.name
                          ]}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  </CardContent>
                </Card>
                      </div>
          </TabsContent>

          <TabsContent value="years">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-200 to-indigo-200 text-gray-800 rounded-t-lg px-6 py-4">
                  <CardTitle className="text-lg">Évolution des montants par année</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      value: {
                        label: "Montant",
                        color: "hsl(var(--chart-4))",
                      },
                    }}
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
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
                          formatter={(value) => [`${Number(value).toLocaleString()} €`, "Montant"]}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  </CardContent>
                </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-slate-200 to-gray-200 text-gray-800 rounded-t-lg px-6 py-4">
                  <CardTitle className="text-lg">Nombre de subsides par année</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ChartContainer
                    config={{
                      count: {
                        label: "Nombre",
                        color: "hsl(var(--chart-5))",
                      },
                    }}
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip 
                          formatter={(value) => [`${Number(value).toLocaleString()} subsides`, "Nombre"]}
                          labelStyle={{ color: '#374151' }}
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
        </Tabs>

                {/* Répartition par secteur avec navigation intégrée */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200/50 rounded-t-lg px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-slate-800 font-semibold">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  Répartition par secteur
                </CardTitle>
                <CardDescription className="text-slate-500 text-sm">Analyse des montants par domaine d&apos;activité</CardDescription>
              </div>
              
                            {/* Navigation rapide intégrée */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Sélecteur d'année */}
                <Select value={selectedDataYear} onValueChange={(value) => {
                  setSelectedDataYear(value)
                  loadData(value)
                }}>
                  <SelectTrigger className="w-32 sm:w-36 h-10 border-0 bg-slate-100 hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-medium transition-all duration-200">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg rounded-lg">
                    <SelectItem value="all" className="hover:bg-slate-50">Toutes</SelectItem>
                    {availableDataYears
                      .filter(year => year !== "all")
                      .sort((a, b) => parseInt(b) - parseInt(a))
                      .map((year) => (
                        <SelectItem key={year} value={year} className="hover:bg-slate-50">
                          {year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Sélecteur de catégorie */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-36 sm:w-40 h-10 border-0 bg-slate-100 hover:bg-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-medium transition-all duration-200">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg rounded-lg">
                    <SelectItem value="all" className="hover:bg-slate-50">Toutes</SelectItem>
                    {uniqueCategories.sort().map((category, index) => (
                      <SelectItem key={`category-${index}-${category}`} value={category} className="hover:bg-slate-50">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Bouton reset */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                    setSelectedCommune("all")
                  }}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 border-0 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Reset
                </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Camembert centré */}
              <div className="flex justify-center max-w-[500px] mx-auto">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={topBeneficiariesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topBeneficiariesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name, props) => {
                        const sectorName = props.payload.name
                        // Extraire les mots clés du nom du secteur
                        const keywords = sectorName.split(' ').slice(0, 3).join(' ')
                        return [keywords, '']
                      }}
                      labelFormatter={() => ''}
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Légende en bas avec pourcentages */}
              <div className="space-y-3">
              
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topBeneficiariesData.map((beneficiary, index) => (
                  <div 
                    key={beneficiary.name} 
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                    onClick={() => handleSectorClick(beneficiary.name)}
                    title={`Cliquer pour filtrer par secteur: ${beneficiary.name}`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: beneficiary.color }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-700 block truncate text-sm hover:text-blue-600 transition-colors" title={beneficiary.name}>
                          {beneficiary.name}
                        </span>
                        <span className="text-xs text-gray-500">({beneficiary.count} subsides)</span>
                      </div>
              </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-bold text-gray-800 text-sm">
                        {((beneficiary.value / totalMontantCamembert) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {beneficiary.value.toLocaleString()} €
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
    </div>
  )
}
