/**
 * EXEMPLE - Ce fichier montre à quoi ressemblera la page FWB
 * 
 * Ce n'est pas le code final, mais un exemple visuel pour comprendre
 * l'interface utilisateur.
 */

"use client"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
import { Badge } from "@/components/ui/badge"
import { FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Exemple de données (sera chargé depuis le fichier JSON généré)
const exampleOrgs = [
  {
    name: "ASBL 1001 Valises (Balkan Trafik)",
    type: "contrat-programme",
    period: "2024-2028",
    hasSubsides: true,
    subsidesCount: 3,
    totalAmount: 45234,
    searchUrl: "/?search=ASBL 1001 Valises (Balkan Trafik)"
  },
  {
    name: "ASBL Animacy (Fifty Lab)",
    type: "contrat-programme",
    period: "2024-2028",
    hasSubsides: true,
    subsidesCount: 1,
    totalAmount: 12000,
    searchUrl: "/?search=ASBL Animacy (Fifty Lab)"
  },
  {
    name: "ASBL Belgomania (Les Francofolies de Spa)",
    type: "contrat-programme",
    period: "2024-2028",
    hasSubsides: false, // ← Pas de subsides, donc pas de lien
    subsidesCount: 0,
    totalAmount: 0,
    searchUrl: null
  }
]

export default function FWBMusiquesActuellesPageExample() {
  // Statistiques
  const totalOrgs = exampleOrgs.length
  const orgsWithSubsides = exampleOrgs.filter(o => o.hasSubsides).length
  const orgsWithoutSubsides = totalOrgs - orgsWithSubsides

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header avec navigation */}
        <AppHeader selectedYear="all" currentPage="info" showNavigation={true} />
        
        {/* En-tête de la page */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">
                  Contrats et CP - Musiques actuelles
                </h1>
                <p className="text-gray-600">
                  Liste des associations bénéficiaires avec liens vers leurs accords de subside
                </p>
              </div>
              
              {/* Statistiques */}
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-900 mb-1">Statistiques</p>
                <p>{totalOrgs} associations</p>
                <p className="text-green-600">{orgsWithSubsides} avec subsides</p>
                <p className="text-gray-400">{orgsWithoutSubsides} sans subsides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des associations */}
        <div className="space-y-4">
          {exampleOrgs.map((org, index) => (
            <Card
              key={index}
              className={`border-2 rounded-lg transition-all ${
                org.hasSubsides
                  ? 'bg-white border-gray-200 hover:shadow-lg'
                  : 'bg-gray-50 border-gray-200 opacity-75'
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  
                  {/* Informations de l'association */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg mb-3 ${
                      org.hasSubsides ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {org.name}
                    </h3>
                    
                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`${
                          org.type === 'contrat-programme'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : org.type === 'contrat-creation'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : org.type === 'contrat-diffusion'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {org.type.replace('contrat-', '')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {org.period}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Section avec lien (si subsides disponibles) */}
                  {org.hasSubsides ? (
                    <div className="flex flex-col items-end gap-2 sm:items-start sm:flex-row sm:items-center">
                      <Button
                        asChild
                        variant="default"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all"
                      >
                        <a
                          href={org.searchUrl || '#'}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Voir les subsides</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                      <div className="text-xs text-gray-500 text-right sm:text-left">
                        <p className="font-medium">
                          {org.subsidesCount} subside{org.subsidesCount > 1 ? 's' : ''}
                        </p>
                        <p>
                          {org.totalAmount.toLocaleString('fr-BE')} €
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-xs text-gray-400 italic">
                        Aucun subside trouvé dans la base de données
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note informative */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Cette liste reprend les associations mentionnées sur la page 
              <a
                href="https://creationartistique.cfwb.be/contrats-et-cp-musiques-actuelles"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-900 ml-1"
              >
                FWB - Musiques actuelles
              </a>.
              Seules les associations ayant des subsides dans notre base de données affichent un lien.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <AppFooter />
      </div>
    </div>
  )
}

/**
 * RÉSUMÉ VISUEL :
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [Header avec navigation: Recherche | Graphs | INFO | FWB] │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                               │
 * │  Contrats et CP - Musiques actuelles                        │
 * │  67 associations • 23 avec subsides • 45 sans subsides     │
 * │                                                               │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                               │
 * │  ┌─────────────────────────────────────────────────────┐    │
 * │  │ ASBL 1001 Valises (Balkan Trafik)                  │    │
 * │  │ [contrat-programme] [2024-2028]                    │    │
 * │  │                                    [Voir subsides] │    │
 * │  │                                    3 subsides      │    │
 * │  │                                    45 234 €        │    │
 * │  └─────────────────────────────────────────────────────┘    │
 * │                                                               │
 * │  ┌─────────────────────────────────────────────────────┐    │
 * │  │ ASBL Belgomania (Les Francofolies de Spa)           │    │
 * │  │ [contrat-programme] [2024-2028]                    │    │
 * │  │                                    Aucun subside   │    │
 * │  │                                    trouvé          │    │
 * │  └─────────────────────────────────────────────────────┘    │
 * │                                                               │
 * │  ... (autres associations)                                   │
 * │                                                               │
 * │  [Note informative avec lien vers page FWB]                 │
 * │                                                               │
 * │  [Footer]                                                    │
 * └─────────────────────────────────────────────────────────────┘
 */
