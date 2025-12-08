"use client"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FileText, Search, PieChart, Download, ExternalLink, Info } from "lucide-react"
import { AppHeader } from "@/components/AppHeader"
import { AppFooter } from "@/components/AppFooter"
// OPTIMISATION: Pas besoin de charger les données pour la page Aide
// import { getCachedData, setCachedData } from "@/lib/cache"
// import { normalizeSubsidesArray } from "@/lib/data-normalizer"
// import type { Subside } from "@/lib/types"

type Language = "fr" | "nl" | "en" | "de"

interface HelpContent {
  title: string
  subtitle: string
  backButton: string
  betaWarning: {
    title: string
    description1: string
    description2: string
    linkText: string
  }
  tableOfContents: {
    title: string
    items: string[]
  }
  whatIsIt: {
    title: string
    description: string
  }
  dataSource: {
    title: string
    description: string
    source: string
    link: string
  }
  howToUse: {
    title: string
    features: Array<{
      icon: string
      title: string
      description: string
    }>
  }
  whatYouCanSee: {
    title: string
    items: string[]
  }
  credits: {
    title: string
    organization: string
    description: string
  }
}

const content: Record<Language, HelpContent> = {
  fr: {
    title: "INFO",
    subtitle: "Informations et aide pour utiliser l'application",
    backButton: "Retour",
    betaWarning: {
      title: "Version Beta",
      description1: "Cette application est actuellement en version Beta. Les données présentées sont à titre d'observation et d'information uniquement.",
      description2: "Important : Pour toute utilisation officielle ou décision importante, veuillez vérifier les sources originales transmises via les liens fournis (Open Data Brussels, KBO, North Data) et consulter les documents officiels de la Région de Bruxelles-Capitale.",
      linkText: "Vérifier les sources officielles sur Open Data Brussels"
    },
    tableOfContents: {
      title: "Table des matières",
      items: [
        "Présentation",
        "Source",
        "Utilisation",
        "Contenu",
        "À propos"
      ]
    },
    whatIsIt: {
      title: "Présentation",
      description: "Cette application vous permet de consulter et d'analyser tous les subsides publics octroyés par la Région de Bruxelles-Capitale. Découvrez comment les fonds publics sont distribués grâce à des visualisations interactives et des outils de recherche avancés."
    },
    dataSource: {
      title: "Source",
      description: "Toutes les données proviennent de la plateforme officielle Open Data Brussels, gérée par la Ville de Bruxelles. Les données sont mises à jour chaque année et couvrent la période de 2019 à 2024.",
      source: "Open Data Brussels",
      link: "https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score"
    },
    howToUse: {
      title: "Utilisation",
      features: [
        {
          icon: "search",
          title: "Recherche",
          description: "Recherchez par nom de bénéficiaire, projet ou numéro de dossier. Combinez plusieurs mots-clés pour affiner vos résultats."
        },
        {
          icon: "chart",
          title: "Graphiques",
          description: "Explorez les données avec des graphiques interactifs : découvrez les principaux bénéficiaires, la répartition par catégorie et l'évolution dans le temps."
        },
        {
          icon: "download",
          title: "Export",
          description: "Téléchargez vos résultats filtrés au format CSV, Excel, JSON ou PDF pour vos propres analyses."
        },
        {
          icon: "link",
          title: "Liens externes",
          description: "Accédez directement aux registres officiels (KBO, North Data) depuis la fiche détaillée de chaque subside."
        }
      ]
    },
    whatYouCanSee: {
      title: "Contenu",
      items: [
        "Le montant octroyé pour chaque subside",
        "Les bénéficiaires avec leurs informations (numéro BCE/KBO)",
        "Les différentes catégories de subsides (Culture, Social, Environnement, etc.)",
        "L'évolution des montants année par année",
        "Le classement des 10 principaux bénéficiaires",
        "Des comparaisons entre différentes années et catégories"
      ]
    },
    credits: {
      title: "À propos",
      organization: "BoringLess",
      description: "Cette application web a été développée par BoringLess sans aucun financement public, pour une société plus juste et plus transparente."
    }
  },
  nl: {
    title: "INFO",
    subtitle: "Informatie en hulp voor het gebruik van de applicatie",
    backButton: "Terug",
    betaWarning: {
      title: "Beta-versie",
      description1: "Deze applicatie is momenteel in Beta-versie. De gepresenteerde gegevens zijn uitsluitend ter observatie en informatie.",
      description2: "Belangrijk: Voor elk officieel gebruik of belangrijke beslissing, gelieve de originele bronnen te verifiëren die via de verstrekte links (Open Data Brussels, KBO, North Data) worden doorgegeven en de officiële documenten van het Brussels Hoofdstedelijk Gewest te raadplegen.",
      linkText: "Verifieer de officiële bronnen op Open Data Brussels"
    },
    tableOfContents: {
      title: "Inhoudsopgave",
      items: [
        "Presentatie",
        "Bron",
        "Gebruik",
        "Inhoud",
        "Over"
      ]
    },
    whatIsIt: {
      title: "Presentatie",
      description: "Met deze applicatie kunt u alle openbare subsidies bekijken en analyseren die door het Brussels Hoofdstedelijk Gewest worden toegekend. Ontdek hoe publieke middelen worden verdeeld via interactieve visualisaties en geavanceerde zoekfuncties."
    },
    dataSource: {
      title: "Bron",
      description: "Alle gegevens komen van het officiële Open Data Brussels-platform, beheerd door de Stad Brussel. De gegevens worden elk jaar bijgewerkt en beslaan de periode van 2019 tot 2024.",
      source: "Open Data Brussels",
      link: "https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score"
    },
    howToUse: {
      title: "Gebruik",
      features: [
        {
          icon: "search",
          title: "Zoeken",
          description: "Zoek op naam van begunstigde, project of dossiersnummer. Combineer meerdere zoektermen om uw resultaten te verfijnen."
        },
        {
          icon: "chart",
          title: "Grafieken",
          description: "Verken de gegevens met interactieve grafieken: ontdek de belangrijkste begunstigden, de verdeling per categorie en de evolutie in de tijd."
        },
        {
          icon: "download",
          title: "Exporteren",
          description: "Download uw gefilterde resultaten in CSV, Excel, JSON of PDF-formaat voor uw eigen analyses."
        },
        {
          icon: "link",
          title: "Externe links",
          description: "Ga direct naar de officiële registers (KBO, North Data) vanuit het detailscherm van elke subsidie."
        }
      ]
    },
    whatYouCanSee: {
      title: "Inhoud",
      items: [
        "Het toegekende bedrag per subsidie",
        "De begunstigden met hun gegevens (KBO-nummer)",
        "De verschillende subsidiecategorieën (Cultuur, Sociaal, Milieu, enz.)",
        "De evolutie van de bedragen per jaar",
        "De top 10 van begunstigden",
        "Vergelijkingen tussen verschillende jaren en categorieën"
      ]
    },
    credits: {
      title: "Over",
      organization: "BoringLess",
      description: "Deze webapplicatie is ontwikkeld door BoringLess zonder enige publieke financiering, voor een rechtvaardigere en transparantere samenleving."
    }
  },
  en: {
    title: "INFO",
    subtitle: "Information and help to use the application",
    backButton: "Back",
    betaWarning: {
      title: "Beta Version",
      description1: "This application is currently in Beta version. The data presented is for observation and information purposes only.",
      description2: "Important: For any official use or important decision, please verify the original sources transmitted via the provided links (Open Data Brussels, KBO, North Data) and consult the official documents of the Brussels-Capital Region.",
      linkText: "Verify official sources on Open Data Brussels"
    },
    tableOfContents: {
      title: "Table of Contents",
      items: [
        "Overview",
        "Source",
        "Usage",
        "Content",
        "About"
      ]
    },
    whatIsIt: {
      title: "Overview",
      description: "This application lets you browse and analyze all public subsidies granted by the Brussels-Capital Region. Discover how public funds are distributed through interactive visualizations and advanced search tools."
    },
    dataSource: {
      title: "Source",
      description: "All data comes from the official Open Data Brussels platform, managed by the City of Brussels. Data is updated every year and covers the period from 2019 to 2024.",
      source: "Open Data Brussels",
      link: "https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score"
    },
    howToUse: {
      title: "Usage",
      features: [
        {
          icon: "search",
          title: "Search",
          description: "Search by beneficiary name, project, or file number. Combine multiple keywords to refine your results."
        },
        {
          icon: "chart",
          title: "Charts",
          description: "Explore the data with interactive charts: discover top beneficiaries, breakdown by category, and trends over time."
        },
        {
          icon: "download",
          title: "Export",
          description: "Download your filtered results in CSV, Excel, JSON, or PDF format for your own analysis."
        },
        {
          icon: "link",
          title: "External links",
          description: "Access official registries (KBO, North Data) directly from each subsidy's detail page."
        }
      ]
    },
    whatYouCanSee: {
      title: "Content",
      items: [
        "The amount granted for each subsidy",
        "Beneficiaries with their information (BCE/KBO number)",
        "Different subsidy categories (Culture, Social, Environment, etc.)",
        "Year-by-year evolution of amounts",
        "Top 10 beneficiaries ranking",
        "Comparisons between different years and categories"
      ]
    },
    credits: {
      title: "About",
      organization: "BoringLess",
      description: "This web application was developed by BoringLess with no public funding, for a fairer and more transparent society."
    }
  },
  de: {
    title: "INFO",
    subtitle: "Informationen und Hilfe zur Nutzung der Anwendung",
    backButton: "Zurück",
    betaWarning: {
      title: "Beta-Version",
      description1: "Diese Anwendung befindet sich derzeit in der Beta-Version. Die präsentierten Daten dienen ausschließlich der Beobachtung und Information.",
      description2: "Wichtig: Für jede offizielle Nutzung oder wichtige Entscheidung bitte die ursprünglichen Quellen überprüfen, die über die bereitgestellten Links (Open Data Brussels, KBO, North Data) übermittelt werden, und die offiziellen Dokumente der Region Brüssel-Hauptstadt konsultieren.",
      linkText: "Offizielle Quellen auf Open Data Brussels überprüfen"
    },
    tableOfContents: {
      title: "Inhaltsverzeichnis",
      items: [
        "Übersicht",
        "Quelle",
        "Nutzung",
        "Inhalt",
        "Über"
      ]
    },
    whatIsIt: {
      title: "Übersicht",
      description: "Mit dieser Anwendung können Sie alle öffentlichen Subventionen einsehen und analysieren, die von der Region Brüssel-Hauptstadt gewährt werden. Erfahren Sie, wie öffentliche Mittel verteilt werden, durch interaktive Visualisierungen und erweiterte Suchfunktionen."
    },
    dataSource: {
      title: "Quelle",
      description: "Alle Daten stammen von der offiziellen Open Data Brussels-Plattform, verwaltet von der Stadt Brüssel. Die Daten werden jährlich aktualisiert und umfassen den Zeitraum von 2019 bis 2024.",
      source: "Open Data Brussels",
      link: "https://opendata.brussels.be/explore/?q=subside&disjunctive.theme&disjunctive.keyword&disjunctive.publisher&disjunctive.attributions&disjunctive.dcat.creator&disjunctive.dcat.contributor&disjunctive.modified&disjunctive.data_processed&disjunctive.features&disjunctive.license&disjunctive.language&sort=explore.popularity_score"
    },
    howToUse: {
      title: "Nutzung",
      features: [
        {
          icon: "search",
          title: "Suche",
          description: "Suchen Sie nach Begünstigtem, Projekt oder Aktennummer. Kombinieren Sie mehrere Suchbegriffe, um Ihre Ergebnisse zu verfeinern."
        },
        {
          icon: "chart",
          title: "Diagramme",
          description: "Erkunden Sie die Daten mit interaktiven Diagrammen: entdecken Sie die wichtigsten Begünstigten, die Aufteilung nach Kategorien und die Entwicklung im Laufe der Zeit."
        },
        {
          icon: "download",
          title: "Export",
          description: "Laden Sie Ihre gefilterten Ergebnisse im CSV-, Excel-, JSON- oder PDF-Format für Ihre eigenen Analysen herunter."
        },
        {
          icon: "link",
          title: "Externe Links",
          description: "Greifen Sie direkt auf offizielle Register (KBO, North Data) von der Detailseite jeder Subvention zu."
        }
      ]
    },
    whatYouCanSee: {
      title: "Inhalt",
      items: [
        "Den gewährten Betrag für jede Subvention",
        "Die Begünstigten mit ihren Informationen (BCE/KBO-Nummer)",
        "Die verschiedenen Subventionskategorien (Kultur, Soziales, Umwelt usw.)",
        "Die jährliche Entwicklung der Beträge",
        "Die Top 10 der Begünstigten",
        "Vergleiche zwischen verschiedenen Jahren und Kategorien"
      ]
    },
    credits: {
      title: "Über",
      organization: "BoringLess",
      description: "Diese Webanwendung wurde von BoringLess ohne öffentliche Finanzierung entwickelt, für eine gerechtere und transparentere Gesellschaft."
    }
  }
}

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "search":
      return <Search className="w-4 h-4 sm:w-5 sm:h-5" />
    case "chart":
      return <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
    case "download":
      return <Download className="w-4 h-4 sm:w-5 sm:h-5" />
    case "link":
      return <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
    default:
      return <Info className="w-4 h-4 sm:w-5 sm:h-5" />
  }
}

export default function AidePage() {
  // Initialiser la langue depuis localStorage immédiatement (évite flash)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem("help-language") as Language | null
      if (savedLanguage && ["fr", "nl", "en", "de"].includes(savedLanguage)) {
        return savedLanguage
      }
    }
    return "fr"
  })
  
  // OPTIMISATION CRITIQUE: Ne PAS charger les données pour la page Aide
  // Stats retirées du header pour performance
  
  // Sauvegarder la langue quand elle change
  useEffect(() => {
    localStorage.setItem("help-language", language)
  }, [language])
  
  const currentContent = content[language]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <AppHeader
          selectedYear="all"
          currentPage="info"
          showNavigation={true}
        />
        
        {/* Header spécifique à la page Aide */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent truncate">
                {currentContent.title}
              </h1>
            </div>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger 
                className="w-full sm:w-[140px] md:w-[160px] min-h-[44px] sm:min-h-0"
                aria-label="Sélectionner la langue"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="nl">Nederlands</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed">{currentContent.subtitle}</p>
        </div>

        {/* Message Beta - Important */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg shadow-sm p-4 sm:p-5 md:p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-amber-900">
                {currentContent.betaWarning.title}
              </h3>
              <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
                {currentContent.betaWarning.description1}
              </p>
              <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
                {currentContent.betaWarning.description2}
              </p>
              <p className="text-sm sm:text-base text-amber-800 leading-relaxed">
                <a 
                  href={currentContent.dataSource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-900 underline hover:text-amber-700 font-medium inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  {currentContent.betaWarning.linkText}
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Accordéon avec toutes les sections */}
        <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4" defaultValue="what-is-it">
          {/* What is it */}
          <AccordionItem value="what-is-it" id="what-is-it" className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm px-3 sm:px-4 md:px-6 scroll-mt-4">
            <AccordionTrigger className="hover:no-underline py-3 sm:py-4 md:py-6 min-h-[44px] sm:min-h-0">
              <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold flex-1 text-left">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <span className="flex-1">{currentContent.whatIsIt.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 sm:pb-4 md:pb-6">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{currentContent.whatIsIt.description}</p>
            </AccordionContent>
          </AccordionItem>

          {/* Data Source */}
          <AccordionItem value="data-source" id="data-source" className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm px-3 sm:px-4 md:px-6 scroll-mt-4">
            <AccordionTrigger className="hover:no-underline py-3 sm:py-4 md:py-6 min-h-[44px] sm:min-h-0">
              <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold flex-1 text-left">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                <span className="flex-1">{currentContent.dataSource.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 sm:pb-4 md:pb-6 space-y-3 sm:space-y-4">
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{currentContent.dataSource.description}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <a
                  href={currentContent.dataSource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 min-h-[44px] sm:min-h-0"
                >
                  <Badge className="bg-green-600 text-white border-0 px-3 py-1.5 sm:py-1 font-semibold cursor-pointer hover:bg-green-700 transition-colors text-xs sm:text-sm">
                    {currentContent.dataSource.source}
                    <ExternalLink className="w-3 h-3 ml-1.5 inline" />
                  </Badge>
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* How to use */}
          <AccordionItem value="how-to-use" id="how-to-use" className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm px-3 sm:px-4 md:px-6 scroll-mt-4">
            <AccordionTrigger className="hover:no-underline py-3 sm:py-4 md:py-6 min-h-[44px] sm:min-h-0">
              <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold flex-1 text-left">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                <span className="flex-1">{currentContent.howToUse.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 sm:pb-4 md:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {currentContent.howToUse.features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                        <div className="w-4 h-4 sm:w-5 sm:h-5">
                          {getIcon(feature.icon)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{feature.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* What you can see */}
          <AccordionItem value="what-you-can-see" id="what-you-can-see" className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm px-3 sm:px-4 md:px-6 scroll-mt-4">
            <AccordionTrigger className="hover:no-underline py-3 sm:py-4 md:py-6 min-h-[44px] sm:min-h-0">
              <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold flex-1 text-left">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                <span className="flex-1">{currentContent.whatYouCanSee.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 sm:pb-4 md:pb-6">
              <ul className="space-y-2 sm:space-y-3">
                {currentContent.whatYouCanSee.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <span className="text-gray-400 mt-0.5 sm:mt-1 text-sm flex-shrink-0">•</span>
                    <span className="text-gray-700 text-sm sm:text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Credits */}
          <AccordionItem value="credits" id="credits" className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-sm px-3 sm:px-4 md:px-6 scroll-mt-4">
            <AccordionTrigger className="hover:no-underline py-3 sm:py-4 md:py-6 min-h-[44px] sm:min-h-0">
              <div className="flex items-center gap-2 text-base sm:text-lg md:text-xl font-semibold flex-1 text-left">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 flex-shrink-0" />
                <span className="flex-1">{currentContent.credits.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 sm:pb-4 md:pb-6 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white border-0 px-3 py-1.5 sm:py-1 font-semibold text-xs sm:text-sm">
                  {currentContent.credits.organization}
                </Badge>
              </div>
              <p className="text-gray-800 text-sm sm:text-base leading-relaxed font-medium">
                {currentContent.credits.description}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer avec compteur de visite et radars */}
        <AppFooter />
      </div>
    </div>
  )
}
