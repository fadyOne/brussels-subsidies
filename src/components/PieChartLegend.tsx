'use client'
import React from 'react'
import { useResponsiveChart } from '@/lib/use-responsive-chart'
import { truncateLegendName } from '@/lib/utils'

interface LegendItem {
  name: string
  color: string
  rank: number
  totalAmount: number
}

interface PieChartLegendProps {
  data: LegendItem[]
  onItemClick?: (item: LegendItem) => void
}

export const PieChartLegend: React.FC<PieChartLegendProps> = ({
  data,
  onItemClick,
}) => {
  const responsiveProps = useResponsiveChart()
  
  // Diviser les données en deux colonnes
  const leftColumn = data.slice(0, 5)
  const rightColumn = data.slice(5, 10)

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Colonne de gauche */}
        <div className="space-y-2">
          {leftColumn.map((item, index) => (
            <div
              key={`left-${index}`}
              onClick={() => onItemClick?.(item)}
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-md transition-colors ${
                onItemClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
            >
              <div
                className="flex-shrink-0 rounded-full"
                style={{
                  width: responsiveProps.isMobile ? 14 : 18,
                  height: responsiveProps.isMobile ? 14 : 18,
                  backgroundColor: item.color,
                }}
              />
              <span
                className={`text-sm sm:text-base text-black ${
                  onItemClick ? 'hover:text-blue-900' : ''
                }`}
              >
                {truncateLegendName(item.name, 30)}
              </span>
            </div>
          ))}
        </div>

        {/* Colonne de droite */}
        <div className="space-y-2">
          {rightColumn.map((item, index) => (
            <div
              key={`right-${index}`}
              onClick={() => onItemClick?.(item)}
              className={`flex items-center gap-2 sm:gap-3 p-2 rounded-md transition-colors ${
                onItemClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
            >
              <div
                className="flex-shrink-0 rounded-full"
                style={{
                  width: responsiveProps.isMobile ? 14 : 18,
                  height: responsiveProps.isMobile ? 14 : 18,
                  backgroundColor: item.color,
                }}
              />
              <span
                className={`text-sm sm:text-base text-black ${
                  onItemClick ? 'hover:text-blue-900' : ''
                }`}
              >
                {truncateLegendName(item.name, 30)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

