/**
 * Liste des organisations FWB - Musiques actuelles
 * 
 * Cette liste sera utilisée pour :
 * 1. Afficher un badge FWB sur les cartes de subsides
 * 2. Créer des liens vers les accords de subside FWB
 */

import { normalizeBeneficiaryName } from './beneficiary-normalizer'

export interface FWBOrganization {
  name: string
  type: 'contrat-programme' | 'contrat-creation' | 'contrat-diffusion' | 'contrat-service'
  period: string
  // URL vers le PDF ou la page FWB (à compléter plus tard)
  pdfUrl?: string
  fwbPageUrl?: string
}

// Liste complète des organisations FWB depuis la page officielle
export const FWB_ORGANIZATIONS: FWBOrganization[] = [
  // Contrats-Programmes
  { name: "ASBL 1001 Valises (Balkan Trafik)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Animacy (Fifty Lab)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Belgomania (Les Francofolies de Spa)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Centre Culturel de la Communauté française – Le Botanique", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Centre des Musiques Actuelles Atelier Rock", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Conseil de la Musique de la CFWB", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Court-Circuit", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Culte (Culte Agency)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Espace Culturel Ferme du Biéreau", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Francofaune", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Gaume Jazz", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Jazz Station", type: "contrat-programme", period: "2024-2028" },
  { name: "SA Les Ardentes", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Les Lundis d'Hortense", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Losange (L'Entrepôt)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Muziekpublique", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Panama (Le Belvédère)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Rockerill Production", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Sowarex", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Studio des Variétés Wallonie-Bruxelles", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Z! (Esperanzah!)", type: "contrat-programme", period: "2024-2028" },
  { name: "ASBL Zig Zag (Couleur Café)", type: "contrat-programme", period: "2024-2028" },
  
  // Contrats de création
  { name: "ASBL Collectif du Lion", type: "contrat-creation", period: "2024-2028" },
  { name: "ASBL Fragan", type: "contrat-creation", period: "2024-2028" },
  { name: "ASBL Jazz Station Big Band", type: "contrat-creation", period: "2024-2026" },
  
  // Contrats de diffusion
  { name: "ASBL 13 Rue Roture (KulturA)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL 470 (Blue Bird Festival)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Bucolique (Bucolique Ferrières Music Festival)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL D'Jazz (Dinant Jazz Festival)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Durbuy Rock Festival", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Entropie (Magasin 4)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Festival d'Art (Festival Les Polysons)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Festiv@Liège (Le Reflektor)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Fête des Solidarités (Les Solidarités)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Jacques Pelzer Jazz Club", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Jazz9", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Jazz à Liège", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Jazz Projects (Brussels Jazz Weekend et Brussels Jazz Alert)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL KWA! (Jam'in Jette)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Label Zik (KidZik Festivals)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL La Maison qui Chante", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL L'An Vert", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Le Coup de Pouce (Inc'Rock/Belgofest)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "SA Le Rideau Rouge", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Les Aralunaires", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Listen (Listen Festival)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Micro Festival", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Muzik4All (ReggaeBus Festival)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL On Ere (Festival Les Gens d'Ere)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Open Music", type: "contrat-diffusion", period: "2024-2028" },
  { name: "SRL RF Prod (Ronquières Festival)", type: "contrat-diffusion", period: "2024-2028" },
  { name: "ASBL Silly Concerts (Le Salon)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL The Music Village", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Toots Jazz (ex-Sounds Live) (Toots Jazz Club)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Tournai Jazz Evenement (Tournai Jazz Festival)", type: "contrat-diffusion", period: "2024-2026" },
  { name: "ASBL Wagon Torpille (L'OM)", type: "contrat-diffusion", period: "2024-2026" },
  
  // Contrats de service
  { name: "SRL 6 T 2", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL AperoHit (Aperohit Talks Academy / Urban 32)", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Art-i", type: "contrat-service", period: "2024-2026" },
  { name: "SRL Artedon (So What ? Productions)", type: "contrat-service", period: "2024-2028" },
  { name: "ASBL Aubergine Artist Management", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Blankollectif (Naff Records)", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Chouette", type: "contrat-service", period: "2024-2026" },
  { name: "SRL Crammed Discs", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Enthusiast Music", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Exag Unlimited (Exag Records)", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL FACIR (Fédération des Auteur·rices Compositeur·rices Interprètes Réuni·es)", type: "contrat-service", period: "2024-2026" },
  { name: "SRL Freaksville Publishing", type: "contrat-service", period: "2024-2028" },
  { name: "ASBL Full Colorz Agency", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Homerecords.be", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Hypnote Records", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Intersection Booking Agency", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Jaune Orange", type: "contrat-service", period: "2024-2028" },
  { name: "ASBL Julia Camino", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL LaBrique", type: "contrat-service", period: "2024-2028" },
  { name: "SRL Laetitia Van Hove (Five Oh)", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Magma", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Maison du Jazz de Liège et de la Communauté française", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Mister B (Diligence Artist Management)", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Nada (Nada booking)", type: "contrat-service", period: "2024-2028" },
  { name: "ASBL Nectar", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Noonexpectation (Humpty Dumpty Records)", type: "contrat-service", period: "2024-2028" },
  { name: "ASBL Odessa Maison d'Artistes", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL SceneOff", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Skinfama", type: "contrat-service", period: "2024-2028" },
  { name: "SRL UBU", type: "contrat-service", period: "2024-2028" },
  { name: "ASBL Vlek", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Wachibouzouk (Capitane Records)", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Zig Zag World", type: "contrat-service", period: "2024-2026" },
  { name: "ASBL Zoart", type: "contrat-service", period: "2024-2026" },
]

// URL de la page FWB officielle
export const FWB_PAGE_URL = "https://creationartistique.cfwb.be/contrats-et-cp-musiques-actuelles"

// Cache pour les noms normalisés FWB (calculé une seule fois)
let normalizedFwbNamesCache: Set<string> | null = null
let normalizedFwbNamesPartialCache: Set<string> | null = null

/**
 * Initialise le cache des noms normalisés FWB (appelé une seule fois)
 */
function initializeFwbCache(): void {
  if (normalizedFwbNamesCache !== null) return // Déjà initialisé
  
  normalizedFwbNamesCache = new Set<string>()
  normalizedFwbNamesPartialCache = new Set<string>()
  
  // TypeScript sait maintenant que partialCache n'est pas null
  const partialCache = normalizedFwbNamesPartialCache
  
  for (const org of FWB_ORGANIZATIONS) {
    const normalizedOrgName = normalizeBeneficiaryName(org.name)
    if (normalizedOrgName) {
      normalizedFwbNamesCache.add(normalizedOrgName)
      // Ajouter aussi les mots-clés significatifs (longueur > 3) pour matching partiel
      if (normalizedOrgName.length > 3) {
        partialCache.add(normalizedOrgName)
        // Ajouter aussi les mots individuels significatifs
        const words = normalizedOrgName.split(/\s+/).filter(w => w.length > 3)
        words.forEach(word => partialCache.add(word))
      }
    }
  }
}

/**
 * Vérifie si un bénéficiaire fait partie de la liste FWB
 * OPTIMISÉ : Utilise un cache pré-calculé pour éviter les recalculs
 */
export function isFWBOrganization(beneficiaryName: string): boolean {
  if (!beneficiaryName) return false
  
  // Initialiser le cache une seule fois
  if (normalizedFwbNamesCache === null) {
    initializeFwbCache()
  }
  
  // Vérifier que le cache est bien initialisé et utiliser des variables locales
  const cache = normalizedFwbNamesCache
  const partialCache = normalizedFwbNamesPartialCache
  if (!cache || !partialCache) {
    return false
  }
  
  const normalizedBeneficiary = normalizeBeneficiaryName(beneficiaryName)
  if (!normalizedBeneficiary) return false
  
  // Matching exact (O(1) avec Set)
  if (cache.has(normalizedBeneficiary)) {
    return true
  }
  
  // Matching partiel (vérifier si un mot-clé significatif est présent)
  if (normalizedBeneficiary.length > 3) {
    const beneficiaryWords = normalizedBeneficiary.split(/\s+/).filter(w => w.length > 3)
    for (const word of beneficiaryWords) {
      if (partialCache.has(word)) {
        // Vérifier si c'est vraiment une correspondance (pas juste un mot commun)
        for (const orgName of cache) {
          if (orgName.includes(word) || normalizedBeneficiary.includes(orgName)) {
            return true
          }
        }
      }
    }
  }
  
  return false
}

/**
 * Trouve l'organisation FWB correspondante à un bénéficiaire
 */
export function findFWBOrganization(beneficiaryName: string): FWBOrganization | null {
  if (!beneficiaryName) return null
  
  const normalizedBeneficiary = normalizeBeneficiaryName(beneficiaryName)
  
  for (const org of FWB_ORGANIZATIONS) {
    const normalizedOrgName = normalizeBeneficiaryName(org.name)
    
    // Matching exact après normalisation
    if (normalizedBeneficiary === normalizedOrgName && normalizedOrgName !== '') {
      return org
    }
    
    // Matching partiel
    if (normalizedOrgName.length > 3 && normalizedBeneficiary.length > 3) {
      if (normalizedBeneficiary.includes(normalizedOrgName) || 
          normalizedOrgName.includes(normalizedBeneficiary)) {
        return org
      }
    }
  }
  
  return null
}

// Cache pour le mapping PDF (chargé une fois)
let pdfMappingCache: Record<string, string> | null = null
let pdfMappingLoading: Promise<Record<string, string>> | null = null

/**
 * Charge le mapping PDF depuis le fichier JSON
 */
async function loadPdfMapping(): Promise<Record<string, string>> {
  // Si déjà en cache, retourner immédiatement
  if (pdfMappingCache) {
    return pdfMappingCache
  }

  // Si déjà en cours de chargement, attendre ce chargement
  if (pdfMappingLoading) {
    return pdfMappingLoading
  }

  // Lancer le chargement
  pdfMappingLoading = (async () => {
    try {
      const response = await fetch('/fwb-pdf-mapping.json')
      if (response.ok) {
        pdfMappingCache = await response.json()
        return pdfMappingCache || {}
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger le mapping PDF FWB:', error)
    } finally {
      pdfMappingLoading = null // Réinitialiser pour permettre un rechargement si nécessaire
    }
    return {}
  })()

  return pdfMappingLoading
}

/**
 * Précharge le mapping PDF en arrière-plan
 * À appeler au chargement de la page pour un accès instantané
 */
export function preloadFwbPdfMapping(): void {
  if (typeof window === 'undefined') return
  if (pdfMappingCache) return // Déjà chargé
  if (pdfMappingLoading) return // Déjà en cours de chargement
  
  // Charger en arrière-plan sans bloquer
  loadPdfMapping().catch(() => {
    // Ignorer les erreurs silencieusement
  })
}

/**
 * Génère l'URL vers la page FWB ou le PDF si disponible
 * 
 * Stratégie :
 * 1. Si un PDF est défini dans l'organisation → utiliser le PDF
 * 2. Si un PDF est trouvé dans le mapping → utiliser le PDF
 * 3. Sinon → pointer vers la page de liste FWB
 */
export async function getFWBUrl(beneficiaryName: string): Promise<string> {
  const org = findFWBOrganization(beneficiaryName)
  
  if (!org) {
    return FWB_PAGE_URL
  }
  
  // 1. Si un PDF est défini directement dans l'organisation
  if (org.pdfUrl) {
    return org.pdfUrl
  }
  
  // 2. Chercher dans le mapping PDF (si disponible côté client)
  if (typeof window !== 'undefined') {
    try {
      const pdfMapping = await loadPdfMapping()
      const pdfUrl = pdfMapping[org.name]
      if (pdfUrl) {
        return pdfUrl
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement
    }
  }
  
  // 3. Fallback : page de liste FWB
  return FWB_PAGE_URL
}

/**
 * Version synchrone pour les cas où on ne peut pas utiliser async
 * (utilise le cache si déjà chargé, sinon retourne la page de liste)
 * 
 * ⚠️ IMPORTANT: Cette fonction retourne FWB_PAGE_URL si le cache n'est pas encore chargé.
 * Utilisez getFWBUrl() en async si vous voulez attendre le chargement.
 */
export function getFWBUrlSync(beneficiaryName: string): string {
  const org = findFWBOrganization(beneficiaryName)
  
  if (!org) {
    return FWB_PAGE_URL
  }
  
  // Si un PDF est défini directement dans l'organisation
  if (org.pdfUrl) {
    return org.pdfUrl
  }
  
  // Si le cache est déjà chargé, l'utiliser (INSTANTANÉ)
  if (pdfMappingCache && pdfMappingCache[org.name]) {
    return pdfMappingCache[org.name]
  }
  
  // Sinon, retourner la page de liste (le mapping sera chargé de manière asynchrone)
  // On retourne une chaîne vide pour indiquer que le cache n'est pas prêt
  // Le composant utilisera alors getFWBUrl() en async
  return ''
}
