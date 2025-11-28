'use client'

export const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="text-center w-full max-w-md">
        <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-base sm:text-lg">Chargement...</p>
        <p className="text-sm sm:text-base text-gray-500 mt-2">Chargement...</p>
      </div>
    </div>
  )
}
