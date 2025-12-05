'use client'
import React from 'react'
import { useResponsiveChart } from '@/lib/use-responsive-chart'
import { truncateLegendName } from '@/lib/utils'

interface Top10ListChartProps {
  data: Array<{
    name: string
    totalAmount: number
    rank: number
    [key: string]: string | number | boolean | Map<string, number> | Set<string> | undefined
  }>
  colors?: string[]
  onItemClick?: (data: { name: string; value: number; [key: string]: unknown }) => void
}

export const Top10ListChart: React.FC<Top10ListChartProps> = ({
  data,
  onItemClick,
  colors = [
    '#3B82F6', // Bleu vif
    '#10B981', // Vert émeraude
    '#F59E0B', // Orange ambré
    '#EF4444', // Rouge vif
    '#FBBF24', // Jaune
    '#06B6D4', // Cyan
    '#84CC16', // Vert lime
    '#F97316', // Orange
    '#EC4899', // Rose
    '#6366F1', // Indigo
  ],
}) => {
  const responsiveProps = useResponsiveChart()
  
  // Calculer le total pour les pourcentages
  const total = data.reduce((sum, item) => sum + item.totalAmount, 0)
  
  // Trouver le montant maximum pour la barre de progression
  const maxAmount = Math.max(...data.map(item => item.totalAmount))

  return (
    <div className="space-y-2">
      {data.map((item, index) => {
        const percentage = total > 0 ? ((item.totalAmount / total) * 100).toFixed(1) : '0'
        const barWidth = (item.totalAmount / maxAmount) * 100
        const color = colors[index % colors.length]

        return (
          <div
            key={item.name}
            onClick={() => {
              if (onItemClick) {
                const { name: _name, totalAmount: _totalAmount, rank: _rank, ...rest } = item
                onItemClick({
                  name: item.name,
                  value: item.totalAmount,
                  rank: item.rank,
                  ...rest,
                })
              }
            }}
            className={`
              flex items-center gap-3 p-3 rounded-lg border border-gray-200
              hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer
              ${responsiveProps.isMobile ? 'flex-col items-stretch' : ''}
            `}
            style={{
              minHeight: responsiveProps.isMobile ? 'auto' : '60px',
            }}
          >
            {/* Rang et nom */}
            <div className={`
              flex items-center gap-3 flex-1 min-w-0
              ${responsiveProps.isMobile ? 'w-full mb-2' : ''}
            `}>
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: color }}
              >
                {item.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="font-medium"
                  style={{
                    fontSize: responsiveProps.isMobile ? '0.875rem' : '1rem',
                    color: '#1e3a8a', // Bleu foncé (blue-900)
                  }}
                  title={item.name}
                >
                  {truncateLegendName(item.name, 24)}
                </div>
                {responsiveProps.isMobile && (
                  <div className="text-sm text-gray-600 mt-1">
                    {item.totalAmount.toLocaleString()} € ({percentage}%)
                  </div>
                )}
              </div>
            </div>

            {/* Barre de progression et montant */}
            <div className={`
              flex items-center gap-3 flex-1
              ${responsiveProps.isMobile ? 'w-full' : ''}
            `}>
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
              {!responsiveProps.isMobile && (
                <div className="flex-shrink-0 text-right min-w-[120px]">
                  <div className="font-semibold text-gray-900">
                    {item.totalAmount.toLocaleString()} €
                  </div>
                  <div className="text-sm text-gray-600">
                    {percentage}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

