// Configuration pour l'API Open Data Bruxelles

export interface APIConfig {
  baseUrl: string
  apiKey?: string
  headers?: Record<string, string>
  rateLimit?: {
    requestsPerMinute: number
    requestsPerHour: number
  }
}

export const BRUSSELS_OPEN_DATA_CONFIG: APIConfig = {
  baseUrl: "https://opendata.bruxelles.be/api/explore/v2.1",
  apiKey: process.env.NEXT_PUBLIC_OPENDATA_API_KEY,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(process.env.NEXT_PUBLIC_OPENDATA_API_KEY && {
      'Authorization': `Apikey ${process.env.NEXT_PUBLIC_OPENDATA_API_KEY}`,
    }),
  },
  rateLimit: {
    requestsPerMinute: 60, // À ajuster selon la documentation
    requestsPerHour: 1000, // À ajuster selon la documentation
  },
}

// Fonction pour créer les headers de requête
export function createAPIHeaders(config: APIConfig): HeadersInit {
  const headers: HeadersInit = {
    ...config.headers,
  }

  // Ajouter la clé API si disponible
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`
    // Ou selon le format requis par l'API:
    // headers['X-API-Key'] = config.apiKey
  }

  return headers
}

// Fonction pour vérifier si l'API nécessite une authentification
export async function checkAPIRequirements(): Promise<{
  requiresAuth: boolean
  requiresApiKey: boolean
  corsEnabled: boolean
  availableDatasets: string[]
}> {
  try {
    const response = await fetch(`${BRUSSELS_OPEN_DATA_CONFIG.baseUrl}/catalog/datasets?limit=1`)

    return {
      requiresAuth: response.status === 401,
      requiresApiKey: response.status === 403,
      corsEnabled: response.ok,
      availableDatasets: response.ok ? ["test-successful"] : [],
    }
  } catch {
    return {
      requiresAuth: false,
      requiresApiKey: false,
      corsEnabled: false,
      availableDatasets: [],
    }
  }
}
