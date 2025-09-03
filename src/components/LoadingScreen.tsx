'use client'

export const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-lg">Chargement...</p>
        <p className="text-sm text-gray-500 mt-2">Chargement...</p>
      </div>
    </div>
  )
}
