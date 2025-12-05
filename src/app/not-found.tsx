import Link from 'next/link'
import { AppHeader } from '@/components/AppHeader'
import { AppFooter } from '@/components/AppFooter'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8">
        <AppHeader showNavigation={true} currentPage="search" />
        
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page non trouvée</h2>
          <p className="text-gray-600 mb-8">
            La page que vous recherchez n&apos;existe pas ou a été déplacée.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
      
      <AppFooter />
    </div>
  )
}

