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

  // Hauteur responsive - réduite car la légende est séparée
  const height = responsiveProps.isMobile ? 400 : 500

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsivePie
        data={pieData}
        margin={{ top: 40, right: 40, bottom: 40, left: 40 }} // Marges réduites car légende séparée
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
        legends={[]} // Légende désactivée - sera affichée séparément
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
  )
}

