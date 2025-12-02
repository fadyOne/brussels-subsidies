'use client'
import { useEffect, useState } from 'react'

export function AppFooter() {
  const [visitCount, setVisitCount] = useState<number>(0)

  useEffect(() => {
    // Compteur de visite simple avec localStorage
    const storedCount = localStorage.getItem('visitCount')
    const count = storedCount ? parseInt(storedCount, 10) + 1 : 1
    localStorage.setItem('visitCount', count.toString())
    setVisitCount(count)
  }, [])

  return (
    <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
          <p className="text-xs sm:text-sm text-gray-600">
            Plus de données seront disponibles prochainement.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
            <span>© BoringLess 2025 - All rights reserved</span>
            <span className="hidden sm:inline">•</span>
            <span>{visitCount.toLocaleString('fr-FR')} visiteurs</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

