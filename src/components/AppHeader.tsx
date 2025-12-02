"use client"
import Link from "next/link"
import Image from "next/image"
import { Heart, Info, PieChart as PieChartIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatNumberWithSpaces } from "@/lib/utils"

interface AppHeaderProps {
  totalAmount?: number
  totalSubsides?: number
  selectedYear?: string
  currentPage?: 'search' | 'analyse' | 'aide'
  showStats?: boolean
  showNavigation?: boolean
}

export function AppHeader({
  totalAmount,
  totalSubsides,
  selectedYear,
  currentPage = 'search',
  showStats = true,
  showNavigation = true,
}: AppHeaderProps) {
  return (
    <>
      {/* Header compact - 1 ligne avec stats - Responsive */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm pl-3 sm:pl-4 md:pl-5 pr-2 sm:pr-2.5 md:pr-3 py-2 sm:py-3 md:py-4">
        {/* Solution 1 : Flex Layout avec zones définies */}
        <div className="flex items-center justify-between gap-2 xs:gap-3">
          {/* Zone gauche : Titre, Stats et Aide */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 xs:gap-5 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent whitespace-nowrap" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.03em', fontWeight: 300 }}>
                Subsides Radar
              </h1>
              <div className="flex items-center gap-0.5" title="Prenez votre temps, travaillez doucement 💚">
                <Heart className="w-[22px] h-[22px] sm:w-[29px] sm:h-[29px] text-black animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} fill="currentColor" />
                <Heart className="w-[17px] h-[17px] sm:w-[25px] sm:h-[25px] text-yellow-500 animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '2s' }} fill="currentColor" />
                <Heart className="w-[22px] h-[22px] sm:w-[29px] sm:h-[29px] text-red-600 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '2s' }} fill="currentColor" />
              </div>
            </div>
            {showStats && (
              <div className="flex flex-col xs:flex-row flex-wrap items-start xs:items-center gap-2 xs:gap-3">
                {totalAmount !== undefined && (
                  <Badge className="text-gray-800 border-0 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 font-bold text-sm sm:text-base md:text-lg" style={{ backgroundColor: '#A7F3D0', borderColor: '#6EE7B7' }}>
                    {formatNumberWithSpaces(totalAmount)} €
                  </Badge>
                )}
                {totalSubsides !== undefined && (
                  <span className="text-gray-600 hidden xs:inline text-xs sm:text-sm">{totalSubsides} subsides</span>
                )}
                {selectedYear && (
                  <Badge variant="outline" className="text-xs sm:text-sm border-gray-300 px-2 sm:px-3 py-1 sm:py-1.5">
                    {selectedYear === "all" ? "2019 → 2024" : selectedYear}
                  </Badge>
                )}
              </div>
            )}
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
            <Link href="/" className="flex-1 relative group min-w-0">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 sm:gap-2 border-gray-200 hover:shadow-md ${
                  currentPage === 'search' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300/50' 
                    : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/50'
                }`}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                <span className="text-blue-900 font-medium truncate">Recherche</span>
              </Button>
            </Link>
            <Link href="/analyse" className="flex-1 relative group min-w-0">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 sm:gap-2 border-gray-200 hover:shadow-md ${
                  currentPage === 'analyse' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300/50' 
                    : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300/50'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                <span className="hidden sm:inline text-green-700 font-medium truncate">Graphs</span>
                <span className="sm:hidden text-green-700 font-medium truncate">Graph</span>
              </Button>
            </Link>
            <Link href="/aide" className="flex-1 relative group min-w-0">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 sm:gap-2 border-gray-200 hover:shadow-md ${
                  currentPage === 'aide' 
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300/50' 
                    : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-300/50'
                }`}
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                <span className="text-purple-700 font-medium truncate">Aide</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

