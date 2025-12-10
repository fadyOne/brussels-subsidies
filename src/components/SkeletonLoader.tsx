'use client'

export function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading indicator with animation */}
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              {/* Spinning ring with pink gradient */}
              <div className="w-16 h-16 border-4 border-pink-200 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-pink-500 rounded-full"></div>
              </div>
              {/* Pulsing center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-700 animate-pulse">
                Chargement des données...
              </h3>
              <p className="text-sm text-gray-500">
                Analyse en cours
              </p>
            </div>
          </div>
        </div>

        {/* Header skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm p-4 animate-pulse">
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
        </div>

        {/* Filters skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm p-4 animate-pulse">
          <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full mb-2"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32"></div>
            <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Charts skeleton with animated bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2"></div>
                <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg relative overflow-hidden">
                  {/* Chart bars skeleton with staggered animation */}
                  <div className="absolute inset-0 flex items-end justify-center gap-2 px-4 pb-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div
                        key={j}
                        className="bg-gradient-to-t from-pink-200 to-pink-100 rounded-t animate-pulse"
                        style={{
                          width: '12%',
                          height: `${40 + (j * 8)}%`,
                          animationDelay: `${j * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

