'use client'
import React from 'react'
import { ResponsivePie } from '@nivo/pie'
import { useResponsiveChart } from '@/lib/use-responsive-chart'
import { truncateLegendName } from '@/lib/utils'
import { RefinedTooltip } from '@/components/RefinedTooltip'

interface Top10PieChartProps {
  data: Array<{
    name: string
    totalAmount: number
    rank: number
    [key: string]: string | number | boolean | Map<string, number> | Set<string> | undefined
  }>
  colors?: string[]
  onSliceClick?: (data: { name: string; value: number; [key: string]: unknown }) => void
}

export const Top10PieChart: React.FC<Top10PieChartProps> = ({
  data,
  onSliceClick,
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
  
  // Transformer les données pour Nivo Pie
  const pieData = data.map((item, index) => ({
    id: String(item.name), // Convertir en string pour éviter les erreurs de type
    label: truncateLegendName(item.name, 24), // Tronquer à 24 caractères
    value: item.totalAmount,
    color: colors[index % colors.length],
    rank: item.rank,
    fullName: item.name, // Garder le nom complet pour le tooltip
  }))

  // Calculer le total pour les pourcentages
  const total = pieData.reduce((sum, item) => sum + item.value, 0)

  const isVerticalLegend = responsiveProps.isMobile || responsiveProps.isTablet
  
  // Hauteur du graphique sans légende intégrée en mode responsive
  const height = responsiveProps.isMobile ? 400 : responsiveProps.isTablet ? 500 : 600

  return (
    <>
      <div style={{ height: `${height}px`, width: '100%' }}>
        <ResponsivePie
          data={pieData}
          margin={{ 
            top: 40, 
            right: 40, 
            bottom: isVerticalLegend ? 40 : 120, // Moins d'espace en bas en mode responsive (légende séparée)
            left: 40 
          }}
        innerRadius={0.5}
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        colors={(d) => d.data.color}
        borderWidth={2}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        enableArcLabels={false} // Désactiver les labels sur les segments (trop encombrés)
        enableArcLinkLabels={false} // Désactiver les liens pour plus de clarté
        legends={isVerticalLegend ? [] : [
          {
            anchor: 'bottom',
            direction: 'row', // Légende horizontale uniquement sur desktop
            justify: false,
            translateX: 0,
            translateY: 80,
            itemsSpacing: 12,
            itemWidth: 200,
            itemHeight: 28,
            itemTextColor: '#333',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        tooltip={({ datum }) => {
          const percentage = total > 0 ? ((datum.value / total) * 100).toFixed(1) : '0'
          const fullName = (datum.data as { fullName?: string }).fullName || String(datum.label)
          const rank = (datum.data as { rank?: number }).rank
          
          return (
            <RefinedTooltip
              title={fullName}
              value={Number(datum.value)}
              percentage={percentage}
              rank={rank}
              color={datum.data.color as string}
            />
          )
        }}
        theme={{
          background: 'transparent',
          text: {
            fontSize: responsiveProps.fontSize,
            fill: '#6B7280',
            fontFamily: 'inherit',
          },
          tooltip: {
            container: {
              background: '#fff',
              color: '#374151',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          },
        }}
        onClick={(datum) => {
          if (onSliceClick) {
            const data = datum.data as { rank?: number; fullName?: string; [key: string]: unknown }
            const fullName = data.fullName || String(datum.label)
            onSliceClick({
              name: fullName,
              value: datum.value,
              rank: data.rank,
              label: fullName,
            })
          }
        }}
      />
      </div>
      
      {/* Légende séparée pour mobile/tablette */}
      {isVerticalLegend && (
        <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {pieData.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
              return (
                <div 
                  key={item.id} 
                  className="flex items-center gap-2 sm:gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onSliceClick) {
                      onSliceClick({
                        name: item.fullName || String(item.label),
                        value: item.value,
                        rank: item.rank,
                        label: item.fullName || String(item.label),
                      })
                    }
                  }}
                >
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate" title={item.fullName || String(item.label)}>
                      {item.fullName || item.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.value.toLocaleString()} € ({percentage}%)
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

