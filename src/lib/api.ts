// Configuration optimisée pour JSON (format natif OpenDataSoft)
// API key is now loaded from environment variables
const API_KEY = process.env.NEXT_PUBLIC_OPENDATA_API_KEY || ""
const BASE_URL = "https://opendata.brussels.be/api/explore/v2.1"

// Types optimisés pour la visualisation
export interface SubsideData {
  id: string
  beneficiaire: string
  montant: number
  annee: number
  secteur: string
  commune: string
  description: string
  date_octroi: string
  date_decision: string
  numero_dossier: string
  type_organisation: string
  adresse: string
  objectif: string
  duree_projet: string
  contact_email: string
  statut: "Accordé" | "En cours" | "Refusé"
  lien_document?: string
  dataset_source: string
  // Champs pour visualisation avancée
  coordonnees?: {
    lat: number
    lng: number
  }
  tags?: string[]
  montant_par_habitant?: number
}

export interface OpenDataRecord {
  recordid: string
  fields: Record<string, string | number | boolean | null>
  geometry?: {
    coordinates: [number, number]
    type: string
  }
  record_timestamp: string
}

export interface OpenDataResponse {
  total_count: number
  results: OpenDataRecord[]
  links?: Array<{
    href: string
    rel: string
  }>
}

// Headers avec support JSON optimisé
function createHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Apikey ${API_KEY}`,
  }
}

// Fonction pour récupérer les données avec format JSON optimisé
export async function fetchDatasetRecords(
  datasetId: string,
  limit = 100,
  offset = 0,
  options?: {
    select?: string
    where?: string
    orderBy?: string
    includeGeometry?: boolean
  },
): Promise<OpenDataResponse> {
  try {
    const params = new URLSearchParams({
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString(),
      // Format JSON avec toutes les métadonnées
      format: "json",
    })

    // Sélectionner tous les champs utiles pour la visualisation
    if (options?.select) {
      params.append("select", options.select)
    }

    if (options?.where) {
      params.append("where", options.where)
    }

    if (options?.orderBy) {
      params.append("order_by", options.orderBy)
    }

    // Inclure la géométrie pour les cartes futures
    if (options?.includeGeometry) {
      params.append("include_geometry", "true")
    }

    const url = `${BASE_URL}/catalog/datasets/${datasetId}/records?${params.toString()}`
    console.log(`📡 Récupération JSON:`, url)

    const response = await fetch(url, {
      headers: createHeaders(),
    })

    if (response.ok) {
      const data: OpenDataResponse = await response.json()
      console.log(`✅ ${data.results?.length || 0}/${data.total_count} records JSON récupérés`)
      return data
    } else {
      const errorText = await response.text()
      console.error(`❌ Erreur dataset ${datasetId}:`, response.status, errorText)
      throw new Error(`Erreur API ${response.status}: ${errorText}`)
    }
  } catch (error) {
    console.error("❌ Erreur récupération JSON:", error)
    throw error
  }
}

// Transformation optimisée pour la visualisation
export function transformRecordsToSubsides(records: OpenDataRecord[], datasetId: string): SubsideData[] {
  console.log(`🔄 Transformation JSON de ${records.length} records`)

  return records.map((record): SubsideData => {
    const fields = record.fields

    // Extraction intelligente avec types préservés
    const montant = Number.parseFloat(
      String(fields.montant || fields.subvention || fields.aide || fields.budget || fields.montant_accorde || "0"),
    )

    const annee = Number.parseInt(
      String(fields.annee || fields.year || fields.exercice || new Date(record.record_timestamp).getFullYear().toString()),
    )

    // Extraction des coordonnées si disponibles
    const coordonnees = record.geometry?.coordinates
      ? {
          lat: record.geometry.coordinates[1],
          lng: record.geometry.coordinates[0],
        }
      : undefined

    // Génération de tags pour filtrage avancé
    const tags = [fields.secteur, fields.type_organisation, fields.commune, fields.statut].filter(Boolean).map(String)

    return {
      id: record.recordid,
      beneficiaire: String(fields.beneficiaire || fields.nom || fields.organisation || "Non spécifié"),
      montant,
      annee,
      secteur: String(fields.secteur || fields.domaine || fields.categorie || "Non spécifié"),
      commune: String(fields.commune || fields.ville || fields.localite || "Non spécifié"),
      description: String(fields.description || fields.objet || fields.projet || "Description non disponible"),
      date_octroi: String(fields.date_octroi || fields.date_attribution || record.record_timestamp),
      date_decision: String(fields.date_decision || fields.date_octroi || record.record_timestamp),
      numero_dossier: String(fields.numero_dossier || fields.reference || record.recordid),
      type_organisation: String(fields.type_organisation || fields.statut_juridique || "Non spécifié"),
      adresse: String(fields.adresse || fields.localisation || "Adresse non disponible"),
      objectif: String(fields.objectif || fields.finalite || "Objectif non spécifié"),
      duree_projet: String(fields.duree || fields.periode || "Non spécifié"),
      contact_email: String(fields.email || fields.contact || ""),
      statut: (fields.statut || fields.etat || "Accordé") as "Accordé" | "En cours" | "Refusé",
      lien_document: fields.lien || fields.url || fields.document ? String(fields.lien || fields.url || fields.document) : undefined,
      dataset_source: datasetId,
      coordonnees,
      tags,
      montant_par_habitant: montant / 1000, // Exemple de calcul pour visualisation
    }
  })
}

// Fonction de recherche simplifiée mais efficace
export async function searchSubsideDatasets(): Promise<Array<{
  dataset_id: string
  title: string
  description?: string
  [key: string]: unknown
}>> {
  try {
    console.log("🔍 Recherche datasets de subsides...")

    // Recherche simple mais efficace
    const searchUrl = `${BASE_URL}/catalog/datasets?q=subside OR subvention&limit=20`

    const response = await fetch(searchUrl, {
      headers: createHeaders(),
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ ${data.total_count} datasets trouvés`)
      return data.results || []
    }

    return []
  } catch (error) {
    console.error("❌ Erreur recherche:", error)
    return []
  }
}

// Fonction principale optimisée
export async function fetchAllSubsides(): Promise<SubsideData[]> {
  try {
    console.log("🚀 Récupération des subsides (format JSON optimisé)...")

    const datasets = await searchSubsideDatasets()

    if (datasets.length === 0) {
      throw new Error("Aucun dataset de subsides trouvé")
    }

    const allSubsides: SubsideData[] = []

    // Traiter les 3 premiers datasets les plus pertinents
    for (let i = 0; i < Math.min(datasets.length, 3); i++) {
      const dataset = datasets[i]

      try {
        console.log(`📊 Dataset ${i + 1}/3: ${dataset.dataset_id}`)

        // Récupérer avec géométrie pour futures cartes
        const response = await fetchDatasetRecords(dataset.dataset_id, 100, 0, { includeGeometry: true })

        if (response.results?.length > 0) {
          const transformedData = transformRecordsToSubsides(response.results, dataset.dataset_id)
          allSubsides.push(...transformedData)
          console.log(`✅ ${transformedData.length} subsides ajoutés`)
        }
      } catch (error) {
        console.warn(`⚠️ Erreur dataset ${dataset.dataset_id}:`, error)
        continue
      }
    }

    console.log(`🎉 Total: ${allSubsides.length} subsides récupérés`)
    return allSubsides
  } catch (error) {
    console.error("❌ Erreur générale:", error)
    throw error
  }
}
