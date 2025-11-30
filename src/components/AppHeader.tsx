"use client"
import Link from "next/link"
import { Heart, Info, PieChart as PieChartIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2.5 sm:p-3">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-3">
          {/* Titre et stats compactes */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-1.5 xs:gap-3 flex-1 min-w-0 w-full xs:w-auto">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent whitespace-nowrap">
                Subsides Bruxelles
              </h1>
              <div className="flex items-center gap-1" title="Prenez votre temps, travaillez doucement 💚">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-black animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} fill="currentColor" />
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '2s' }} fill="currentColor" />
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '2s' }} fill="currentColor" />
              </div>
            </div>
            {showStats && (
              <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 text-xs sm:text-sm">
                {totalAmount !== undefined && (
                  <Badge className="text-gray-800 border-0 px-2 py-0.5 sm:py-1 font-semibold text-xs sm:text-sm" style={{ backgroundColor: '#A7F3D0', borderColor: '#6EE7B7' }}>
                    {totalAmount.toLocaleString()} €
                  </Badge>
                )}
                {totalSubsides !== undefined && (
                  <span className="text-gray-600 hidden xs:inline">{totalSubsides} subsides</span>
                )}
                {selectedYear && (
                  <Badge variant="outline" className="text-xs border-gray-300 px-1.5 py-0.5">
                    {selectedYear === "all" ? "Toutes" : selectedYear}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 w-full xs:w-auto">
            <Link href="/aide">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-gray-300 hover:bg-gray-50 flex-shrink-0"
                title="Aide et informations"
              >
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-1.5">Aide</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      {showNavigation && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm rounded-lg p-1 h-auto">
            <Link href="/" className="flex-1 relative group">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border-gray-200 hover:shadow-md ${
                  currentPage === 'search' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300/50' 
                    : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/50'
                }`}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Recherche</span>
              </Button>
            </Link>
            <Link href="/analyse" className="flex-1 relative group">
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <Button
                variant="outline"
                className={`relative w-full rounded-md transition-all py-2 sm:py-2.5 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 border-gray-200 hover:shadow-md ${
                  currentPage === 'analyse' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300/50' 
                    : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:border-green-300/50'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                <span className="hidden sm:inline text-green-700 font-medium">Graphs</span>
                <span className="sm:hidden text-green-700 font-medium">Graph</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

