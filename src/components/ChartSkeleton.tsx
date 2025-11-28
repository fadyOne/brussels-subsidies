'use client'
/**
 * Chart Skeleton Loader
 * 
 * Provides a loading state for charts while data is being fetched.
 * Shows an animated skeleton that matches the chart dimensions.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface ChartSkeletonProps {
  height?: number
  showHeader?: boolean
  className?: string
}

export function ChartSkeleton({ 
  height = 400, 
  showHeader = true,
  className = '' 
}: ChartSkeletonProps) {
  return (
    <Card className={`bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm ${className}`}>
      {showHeader && (
        <CardHeader className="border-b border-gray-100 px-6 py-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div 
          className="relative w-full bg-gray-50 rounded-lg overflow-hidden"
          style={{ height: `${height}px` }}
        >
          {/* Animated bars skeleton */}
          <div className="absolute inset-0 flex items-end justify-center gap-2 px-4 pb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-t from-blue-200 to-blue-100 rounded-t animate-pulse"
                style={{
                  width: '8%',
                  height: `${60 + Math.random() * 40}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          
          {/* Grid lines skeleton */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-gray-300"
                style={{
                  top: `${(i + 1) * 20}%`,
                }}
              />
            ))}
          </div>
          
          {/* Loading text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="inline-block h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Chargement des données...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Simple chart placeholder for inline use
 */
export function ChartPlaceholder({ height = 200 }: { height?: number }) {
  return (
    <div 
      className="w-full bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200"
      style={{ height: `${height}px` }}
    >
      <div className="text-center space-y-2">
        <div className="inline-block h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Chargement...</p>
      </div>
    </div>
  )
}

