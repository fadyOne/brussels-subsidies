'use client'

export const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-48 bg-gray-200 rounded"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-1 animate-pulse">
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded-md"></div>
            <div className="flex-1 h-10 bg-gray-200 rounded-md"></div>
            <div className="flex-1 h-10 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-11 bg-gray-200 rounded-lg"></div>
            <div className="h-11 w-40 bg-gray-200 rounded-md"></div>
            <div className="h-11 w-11 bg-gray-200 rounded-md"></div>
            <div className="h-11 w-11 bg-gray-200 rounded-md"></div>
          </div>
        </div>

        {/* Content Cards Skeleton */}
        <div className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-lg p-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border-2 rounded-lg p-3 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



