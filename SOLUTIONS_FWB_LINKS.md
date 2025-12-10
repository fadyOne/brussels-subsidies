# Solutions pour ajouter des liens vers les accords de subside FWB

## Contexte
L'objectif est d'afficher une liste des associations de la page [FWB - Musiques actuelles](https://creationartistique.cfwb.be/contrats-et-cp-musiques-actuelles) avec un lien vers leur accord de subside, **uniquement pour les associations qui apparaissent dans la base de données de subsides**.

---

## Solution 1 : Matching par nom normalisé côté client (Recommandée)

### Principe
- Charger toutes les données de subsides une fois
- Pour chaque association FWB, chercher dans les données chargées si elle correspond
- Utiliser la normalisation de noms existante pour gérer les variantes
- Afficher le lien uniquement si une correspondance est trouvée

### Avantages
- ✅ Pas de fichier supplémentaire à maintenir
- ✅ Utilise la logique de normalisation existante
- ✅ Fonctionne avec toutes les données disponibles
- ✅ Mise à jour automatique quand les données changent

### Inconvénients
- ⚠️ Nécessite de charger toutes les données (mais déjà fait ailleurs dans l'app)
- ⚠️ Matching peut être imparfait pour certains noms

### Implémentation

```typescript
// src/lib/fwb-matcher.ts
import type { Subside } from './types'
import { normalizeBeneficiaryName } from './beneficiary-normalizer'

export interface FWBOrganization {
  name: string
  type: 'contrat-programme' | 'contrat-creation' | 'contrat-diffusion' | 'contrat-service'
  period: string
}

/**
 * Trouve les subsides correspondant à une organisation FWB
 */
export function findSubsidesForFWBOrg(
  org: FWBOrganization,
  allSubsides: Subside[]
): Subside[] {
  const normalizedOrgName = normalizeBeneficiaryName(org.name)
  
  return allSubsides.filter(subside => {
    const normalizedBeneficiary = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
    
    // Matching exact après normalisation
    if (normalizedBeneficiary === normalizedOrgName && normalizedOrgName !== '') {
      return true
    }
    
    // Matching partiel (si le nom normalisé de l'org est contenu dans le bénéficiaire ou vice versa)
    if (normalizedOrgName.length > 3 && normalizedBeneficiary.length > 3) {
      if (normalizedBeneficiary.includes(normalizedOrgName) || 
          normalizedOrgName.includes(normalizedBeneficiary)) {
        return true
      }
    }
    
    return false
  })
}

/**
 * Génère l'URL de recherche pour une organisation
 */
export function generateSubsideSearchUrl(orgName: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const encodedName = encodeURIComponent(orgName)
  return `${baseUrl}/?search=${encodedName}`
}
```

```tsx
// src/app/fwb-musiques-actuelles/page.tsx
"use client"
import { useState, useEffect, useMemo } from "react"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Subside } from "@/lib/types"
import { normalizeSubsidesArray } from "@/lib/data-normalizer"
import { findSubsidesForFWBOrg, generateSubsideSearchUrl } from "@/lib/fwb-matcher"
import { getCachedData } from "@/lib/cache"

// Liste des associations FWB (à extraire de la page web)
const FWB_ORGANIZATIONS = [
  { name: "ASBL 1001 Valises (Balkan Trafik)", type: "contrat-programme" as const, period: "2024-2028" },
  { name: "ASBL Animacy (Fifty Lab)", type: "contrat-programme" as const, period: "2024-2028" },
  { name: "ASBL Belgomania (Les Francofolies de Spa)", type: "contrat-programme" as const, period: "2024-2028" },
  // ... ajouter toutes les autres associations
]

export default function FWBMusiquesActuellesPage() {
  const [subsides, setSubsides] = useState<Subside[]>([])
  const [loading, setLoading] = useState(true)

  // Charger toutes les données de subsides
  useEffect(() => {
    const loadData = async () => {
      try {
        // Essayer le cache d'abord
        const cached = getCachedData("all")
        if (cached && cached.length > 0) {
          setSubsides(cached)
          setLoading(false)
          return
        }

        // Sinon charger toutes les années
        const years = ["2024", "2023", "2022", "2021", "2020", "2019"]
        const allData: Subside[] = []
        
        for (const year of years) {
          try {
            const response = await fetch(`/data-${year}.json`)
            if (response.ok) {
              const rawData = await response.json()
              const normalized = normalizeSubsidesArray(rawData, year)
              allData.push(...normalized)
            }
          } catch (err) {
            console.warn(`Erreur chargement ${year}:`, err)
          }
        }
        
        setSubsides(allData)
      } catch (error) {
        console.error("Erreur chargement données:", error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Pour chaque organisation FWB, trouver les subsides correspondants
  const orgsWithSubsides = useMemo(() => {
    return FWB_ORGANIZATIONS.map(org => {
      const matchingSubsides = findSubsidesForFWBOrg(org, subsides)
      return {
        ...org,
        hasSubsides: matchingSubsides.length > 0,
        subsidesCount: matchingSubsides.length,
        totalAmount: matchingSubsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0),
        searchUrl: generateSubsideSearchUrl(org.name)
      }
    })
  }, [subsides])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AppHeader selectedYear="all" currentPage="fwb" showNavigation={true} />
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Contrats et CP - Musiques actuelles</h1>
          <p className="text-gray-600 mb-6">
            Liste des associations bénéficiaires avec liens vers leurs accords de subside
          </p>

          <div className="space-y-4">
            {orgsWithSubsides.map((org, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{org.type}</Badge>
                      <Badge variant="outline">{org.period}</Badge>
                    </div>
                  </div>
                  
                  {org.hasSubsides && (
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        asChild
                        variant="default"
                        className="flex items-center gap-2"
                      >
                        <a
                          href={org.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="w-4 h-4" />
                          Voir les subsides
                        </a>
                      </Button>
                      <p className="text-xs text-gray-500 text-right">
                        {org.subsidesCount} subside{org.subsidesCount > 1 ? 's' : ''} • 
                        {org.totalAmount.toLocaleString()} €
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AppFooter />
      </div>
    </div>
  )
}
```

---

## Solution 2 : Fichier de mapping pré-calculé

### Principe
- Créer un script qui génère un fichier JSON de mapping entre les organisations FWB et leurs subsides
- Le script s'exécute une fois (ou périodiquement) pour générer le mapping
- La page charge ce fichier JSON léger au lieu de toutes les données

### Avantages
- ✅ Performance optimale (fichier JSON léger)
- ✅ Pas besoin de charger toutes les données de subsides
- ✅ Matching peut être vérifié et corrigé manuellement si nécessaire

### Inconvénients
- ⚠️ Fichier à maintenir et régénérer quand les données changent
- ⚠️ Matching doit être fait en amont

### Implémentation

```javascript
// scripts/generate-fwb-mapping.js
const fs = require('fs')
const path = require('path')

// Charger toutes les données de subsides
const years = ['2019', '2020', '2021', '2022', '2023', '2024']
const allSubsides = []

years.forEach(year => {
  try {
    const filePath = path.join(__dirname, `../public/data-${year}.json`)
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      allSubsides.push(...data)
    }
  } catch (err) {
    console.warn(`Erreur chargement ${year}:`, err)
  }
})

// Liste des organisations FWB
const fwbOrgs = [
  { name: "ASBL 1001 Valises (Balkan Trafik)", type: "contrat-programme", period: "2024-2028" },
  // ... toutes les autres
]

// Fonction de normalisation (identique à celle du code)
function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\-\/|_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Générer le mapping
const mapping = fwbOrgs.map(org => {
  const normalizedOrgName = normalizeName(org.name)
  
  const matchingSubsides = allSubsides.filter(subside => {
    const beneficiary = subside.beneficiaire_begunstigde || 
                       subside.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
                       ''
    const normalizedBeneficiary = normalizeName(beneficiary)
    
    if (normalizedBeneficiary === normalizedOrgName && normalizedOrgName !== '') {
      return true
    }
    
    if (normalizedOrgName.length > 3 && normalizedBeneficiary.length > 3) {
      if (normalizedBeneficiary.includes(normalizedOrgName) || 
          normalizedOrgName.includes(normalizedBeneficiary)) {
        return true
      }
    }
    
    return false
  })
  
  return {
    name: org.name,
    type: org.type,
    period: org.period,
    hasSubsides: matchingSubsides.length > 0,
    subsidesCount: matchingSubsides.length,
    totalAmount: matchingSubsides.reduce((sum, s) => {
      const amount = s.montant_octroye_toegekend_bedrag || 
                     s.montant_octroye_toegekend_bedrag || 0
      return sum + (typeof amount === 'number' ? amount : 0)
    }, 0),
    // Optionnel: stocker les IDs des subsides pour référence
    subsideIds: matchingSubsides.map(s => s.article_complet_volledig_artikel || s.recordid).slice(0, 5)
  }
})

// Sauvegarder le mapping
const outputPath = path.join(__dirname, '../public/fwb-musiques-actuelles-mapping.json')
fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8')

console.log(`✅ Mapping généré: ${mapping.length} organisations`)
console.log(`   ${mapping.filter(m => m.hasSubsides).length} avec subsides`)
```

```tsx
// src/app/fwb-musiques-actuelles/page.tsx
"use client"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FWBOrgMapping {
  name: string
  type: string
  period: string
  hasSubsides: boolean
  subsidesCount: number
  totalAmount: number
}

export default function FWBMusiquesActuellesPage() {
  const [mapping, setMapping] = useState<FWBOrgMapping[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/fwb-musiques-actuelles-mapping.json')
      .then(res => res.json())
      .then(data => {
        setMapping(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Erreur chargement mapping:', err)
        setLoading(false)
      })
  }, [])

  const generateSearchUrl = (orgName: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/?search=${encodeURIComponent(orgName)}`
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AppHeader selectedYear="all" currentPage="fwb" showNavigation={true} />
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Contrats et CP - Musiques actuelles</h1>
          <p className="text-gray-600 mb-6">
            Liste des associations bénéficiaires avec liens vers leurs accords de subside
          </p>

          <div className="space-y-4">
            {mapping.map((org, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{org.type}</Badge>
                      <Badge variant="outline">{org.period}</Badge>
                    </div>
                  </div>
                  
                  {org.hasSubsides && (
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        asChild
                        variant="default"
                        className="flex items-center gap-2"
                      >
                        <a
                          href={generateSearchUrl(org.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="w-4 h-4" />
                          Voir les subsides
                        </a>
                      </Button>
                      <p className="text-xs text-gray-500 text-right">
                        {org.subsidesCount} subside{org.subsidesCount > 1 ? 's' : ''} • 
                        {org.totalAmount.toLocaleString()} €
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AppFooter />
      </div>
    </div>
  )
}
```

---

## Solution 3 : API endpoint dynamique

### Principe
- Créer un endpoint API Next.js qui prend le nom d'une organisation en paramètre
- L'endpoint cherche dans les données de subsides et retourne si l'organisation a des subsides
- La page fait des appels API pour chaque organisation (ou en batch)

### Avantages
- ✅ Pas de données chargées côté client
- ✅ Logique centralisée côté serveur
- ✅ Peut être mis en cache

### Inconvénients
- ⚠️ Plusieurs requêtes HTTP (ou une requête batch)
- ⚠️ Nécessite un endpoint API supplémentaire
- ⚠️ Latence réseau

### Implémentation

```typescript
// src/app/api/fwb-check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { Subside } from '@/lib/types'
import { normalizeBeneficiaryName } from '@/lib/beneficiary-normalizer'
import { normalizeSubsidesArray } from '@/lib/data-normalizer'
import fs from 'fs'
import path from 'path'

// Cache en mémoire (optionnel, pour performance)
let cachedSubsides: Subside[] | null = null

async function getAllSubsides(): Promise<Subside[]> {
  if (cachedSubsides) {
    return cachedSubsides
  }

  const years = ['2019', '2020', '2021', '2022', '2023', '2024']
  const allData: Subside[] = []

  for (const year of years) {
    try {
      const filePath = path.join(process.cwd(), 'public', `data-${year}.json`)
      if (fs.existsSync(filePath)) {
        const rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        const normalized = normalizeSubsidesArray(rawData, year)
        allData.push(...normalized)
      }
    } catch (err) {
      console.warn(`Erreur chargement ${year}:`, err)
    }
  }

  cachedSubsides = allData
  return allData
}

export async function POST(request: NextRequest) {
  try {
    const { organizations } = await request.json()
    
    if (!Array.isArray(organizations)) {
      return NextResponse.json(
        { error: 'organizations must be an array' },
        { status: 400 }
      )
    }

    const allSubsides = await getAllSubsides()
    const results = organizations.map((orgName: string) => {
      const normalizedOrgName = normalizeBeneficiaryName(orgName)
      
      const matchingSubsides = allSubsides.filter(subside => {
        const normalizedBeneficiary = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
        
        if (normalizedBeneficiary === normalizedOrgName && normalizedOrgName !== '') {
          return true
        }
        
        if (normalizedOrgName.length > 3 && normalizedBeneficiary.length > 3) {
          if (normalizedBeneficiary.includes(normalizedOrgName) || 
              normalizedOrgName.includes(normalizedBeneficiary)) {
            return true
          }
        }
        
        return false
      })

      return {
        name: orgName,
        hasSubsides: matchingSubsides.length > 0,
        subsidesCount: matchingSubsides.length,
        totalAmount: matchingSubsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Erreur API fwb-check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

```tsx
// src/app/fwb-musiques-actuelles/page.tsx
"use client"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const FWB_ORGANIZATIONS = [
  { name: "ASBL 1001 Valises (Balkan Trafik)", type: "contrat-programme", period: "2024-2028" },
  // ... toutes les autres
]

interface OrgWithSubsides {
  name: string
  type: string
  period: string
  hasSubsides: boolean
  subsidesCount: number
  totalAmount: number
}

export default function FWBMusiquesActuellesPage() {
  const [orgs, setOrgs] = useState<OrgWithSubsides[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSubsides = async () => {
      try {
        const orgNames = FWB_ORGANIZATIONS.map(o => o.name)
        
        const response = await fetch('/api/fwb-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizations: orgNames })
        })

        if (!response.ok) throw new Error('Erreur API')

        const { results } = await response.json()
        
        const orgsWithData = FWB_ORGANIZATIONS.map((org, index) => ({
          ...org,
          ...results[index]
        }))

        setOrgs(orgsWithData)
      } catch (error) {
        console.error('Erreur vérification subsides:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubsides()
  }, [])

  const generateSearchUrl = (orgName: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/?search=${encodeURIComponent(orgName)}`
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <AppHeader selectedYear="all" currentPage="fwb" showNavigation={true} />
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Contrats et CP - Musiques actuelles</h1>
          <p className="text-gray-600 mb-6">
            Liste des associations bénéficiaires avec liens vers leurs accords de subside
          </p>

          <div className="space-y-4">
            {orgs.map((org, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{org.type}</Badge>
                      <Badge variant="outline">{org.period}</Badge>
                    </div>
                  </div>
                  
                  {org.hasSubsides && (
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        asChild
                        variant="default"
                        className="flex items-center gap-2"
                      >
                        <a
                          href={generateSearchUrl(org.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="w-4 h-4" />
                          Voir les subsides
                        </a>
                      </Button>
                      <p className="text-xs text-gray-500 text-right">
                        {org.subsidesCount} subside{org.subsidesCount > 1 ? 's' : ''} • 
                        {org.totalAmount.toLocaleString()} €
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AppFooter />
      </div>
    </div>
  )
}
```

---

## Comparaison : Chargement des données

| Critère | Solution 1 (Client) | Solution 2 (Pré-calculé) ⭐ | Solution 3 (API) |
|---------|---------------------|---------------------------|-------------------|
| **Données chargées par visite** | ~7MB (toutes les données) | ~50-100KB (mapping uniquement) | ~7MB (côté serveur) |
| **Première visite** | Charge depuis JSON | Charge mapping léger | Requête API |
| **Visites suivantes** | Cache localStorage (24h) | Mapping léger (toujours) | Requête API |
| **Mise à jour automatique** | ✅ Oui (si cache expiré) | ❌ Non (script manuel) | ✅ Oui |
| **Performance** | Moyenne | ⚡ **Excellente** | Moyenne |
| **Maintenance** | Aucune | Régénérer 1x/an | Aucune |
| **Taille fichier** | N/A | ~50-100KB | N/A |

### Solution 1 : Matching côté client
- **Première visite** : Charge toutes les données depuis les fichiers JSON (~7MB)
- **Visites suivantes (24h)** : Utilise le cache localStorage (rapide)
- **Après 24h** : Recharge depuis les fichiers JSON
- ⚠️ **Charge les données à chaque visite** (même si en cache, il faut les parser)

### Solution 2 : Fichier pré-calculé ⭐ **MEILLEURE SI DONNÉES RARES**
- **Génération** : Une seule fois avec un script (quand les données changent)
- **Chaque visite** : Charge uniquement le fichier JSON léger (~50-100KB)
- ✅ **Ne charge JAMAIS toutes les données de subsides**
- ✅ **Performance optimale** : Fichier très léger, chargement instantané

### Solution 3 : API endpoint
- **Chaque visite** : Fait une requête API qui charge toutes les données côté serveur
- ⚠️ **Charge les données à chaque visite** (mais côté serveur)

---

## Recommandation

**Si les données ne changent pas souvent** → **Solution 2 (Fichier pré-calculé)** ⭐

**Pourquoi ?**
- ✅ **Performance maximale** : Fichier JSON de ~50-100KB vs ~7MB de données complètes
- ✅ **Chargement instantané** : Pas besoin de parser 7000+ subsides
- ✅ **Pas de dépendance au cache** : Fonctionne même si localStorage est vide
- ✅ **Maintenance simple** : Régénérer le fichier seulement quand les données changent (1x par an)
- ✅ **Vérification manuelle possible** : Vous pouvez corriger les matchings dans le JSON si besoin

**Quand utiliser Solution 1 ?**
- Si vous voulez que le matching se mette à jour automatiquement sans intervention
- Si les données changent très fréquemment

**Quand utiliser Solution 3 ?**
- Si vous avez besoin de logique serveur complexe
- Si vous voulez éviter tout fichier statique

---

## Prochaines étapes

1. Extraire la liste complète des associations depuis la page FWB
2. Choisir une solution
3. Implémenter la solution choisie
4. Tester les matchings et ajuster si nécessaire
5. Ajouter la page au menu de navigation
