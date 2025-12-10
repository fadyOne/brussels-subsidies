"use client"
import Link from "next/link"
import Image from "next/image"
import { Heart, Info, PieChart as PieChartIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { memo } from "react"

interface AppHeaderProps {
  selectedYear?: string
  currentPage?: 'search' | 'analyse' | 'info'
  showNavigation?: boolean
}

function AppHeaderComponent({
  selectedYear,
  currentPage = 'search',
  showNavigation = true,
}: AppHeaderProps) {
  // Styles constants (ne changent jamais) - pas besoin de useMemo
  const titleStyle = {
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    letterSpacing: '-0.03em',
    fontWeight: 300
  }
  
  const heartStyle1 = { animationDelay: '0s', animationDuration: '2s' }
  const heartStyle2 = { animationDelay: '0.4s', animationDuration: '2s' }
  const heartStyle3 = { animationDelay: '0.8s', animationDuration: '2s' }
  return (
    <>
      {/* Header compact - 1 ligne avec stats - Responsive */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm pl-3 sm:pl-4 md:pl-5 pr-2 sm:pr-2.5 md:pr-3 py-2 sm:py-3 md:py-4">
        {/* Solution 1 : Flex Layout avec zones définies */}
        <div className="flex items-center justify-between gap-2 xs:gap-3">
          {/* Zone gauche : Titre, Stats et Aide */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 xs:gap-5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent whitespace-nowrap" style={titleStyle}>
                Subsides Radar
              </h1>
              <div className="flex items-center gap-0.5" title="Prenez votre temps, travaillez doucement 💚">
                <Heart className="w-[22px] h-[22px] sm:w-[29px] sm:h-[29px] text-black animate-pulse" style={heartStyle1} fill="currentColor" />
                <Heart className="w-[17px] h-[17px] sm:w-[25px] sm:h-[25px] text-yellow-500 animate-pulse" style={heartStyle2} fill="currentColor" />
                <Heart className="w-[22px] h-[22px] sm:w-[29px] sm:h-[29px] text-red-600 animate-pulse" style={heartStyle3} fill="currentColor" />
              </div>
            </div>
            {/* Stats retirées du header pour performance - affichées uniquement dans la page recherche */}
          </div>
          
          {/* Zone droite : Logo (3-4x plus grand) - bien aligné à droite avec animation radar */}
          <div className="flex-shrink-0 flex items-center">
            <div className="radar-container relative">
              <Image
                src="/images/image-6-removebg-preview.png"
                alt="Subsides Radar Logo"
                width={160}
                height={160}
                className="w-[83px] h-[83px] sm:w-[125px] sm:h-[125px] md:w-[166px] md:h-[166px] object-contain relative z-10"
                priority
              />
              <div className="radar-sweep">
                <div className="radar-circle"></div>
                <div className="radar-circle"></div>
                <div className="radar-circle"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      {showNavigation && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1 h-auto">
            <Link 
              href="/" 
              className="flex-1 relative group min-w-0"
              prefetch={true}
            >
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:shadow-md ${
                  currentPage === 'search' 
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-500 shadow-sm font-bold' 
                    : 'border-gray-200 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:border-pink-300/50'
                }`}
              >
                <Search className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${currentPage === 'search' ? 'text-pink-700' : 'text-pink-600'}`} />
                <span className={`truncate uppercase ${currentPage === 'search' ? 'text-pink-900 font-bold text-base sm:text-lg' : 'text-pink-900 font-semibold text-sm sm:text-base'}`}>Recherche</span>
                {currentPage === 'search' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-full"></div>
                )}
              </Button>
            </Link>
            <Link 
              href="/analyse" 
              className="flex-1 relative group min-w-0"
              prefetch={true}
            >
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:shadow-md ${
                  currentPage === 'analyse' 
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-500 shadow-sm font-bold' 
                    : 'border-gray-200 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:border-pink-300/50'
                }`}
              >
                <PieChartIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${currentPage === 'analyse' ? 'text-pink-700' : 'text-pink-600'}`} />
                <span className={`truncate uppercase ${currentPage === 'analyse' ? 'text-pink-900 font-bold text-base sm:text-lg' : 'text-pink-900 font-semibold text-sm sm:text-base'}`}>
                  <span className="hidden sm:inline">Graphs</span>
                  <span className="sm:hidden">Graph</span>
                </span>
                {currentPage === 'analyse' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-full"></div>
                )}
              </Button>
            </Link>
            <Link href="/aide" className="flex-1 relative group min-w-0" prefetch={true}>
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 hover:shadow-md ${
                  currentPage === 'info' 
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-500 shadow-sm font-bold' 
                    : 'border-gray-200 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:border-pink-300/50'
                }`}
              >
                <Info className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${currentPage === 'info' ? 'text-pink-700' : 'text-pink-600'}`} />
                <span className={`truncate uppercase ${currentPage === 'info' ? 'text-pink-900 font-bold text-base sm:text-lg' : 'text-pink-900 font-semibold text-sm sm:text-base'}`}>INFO</span>
                {currentPage === 'info' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-pink-500 rounded-full"></div>
                )}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

// Mémoriser le composant pour éviter les recalculs quand les props ne changent pas
export const AppHeader = memo(AppHeaderComponent, (prevProps, nextProps) => {
  // Ne recalculer QUE si currentPage ou showNavigation changent
  // Ignorer selectedYear qui change souvent mais n'affecte pas le rendu
  return (
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.showNavigation === nextProps.showNavigation
  )
})
