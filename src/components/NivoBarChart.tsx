'use client'
import React from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useResponsiveChart } from '@/lib/use-responsive-chart'
import { truncateLegendName } from '@/lib/utils'
import { RefinedTooltip } from '@/components/RefinedTooltip'

interface NivoBarChartProps {
  data: Array<{
    name: string
    totalAmount: number
    [key: string]: string | number | boolean | Map<string, number> | Set<string> | undefined
  }>
  colors?: string[]
  totalForPercentage?: number // Total optionnel pour calculer le pourcentage (si différent de la somme des données)
  height?: number // Hauteur du graphique (override responsive, optionnel)
  leftMargin?: number // Marge gauche pour les noms longs (override responsive, optionnel)
  padding?: number // Padding entre les barres (override responsive, optionnel)
  useResponsive?: boolean // Activer le mode responsive (défaut: true)
  onBarClick?: (data: { name: string; value: number; [key: string]: unknown }) => void // Handler pour clic sur barre
}

export const NivoBarChart: React.FC<NivoBarChartProps> = ({ 
  data, 
  totalForPercentage,
  height: heightOverride,
  leftMargin: leftMarginOverride,
  padding: paddingOverride,
  useResponsive = true,
  onBarClick,
  colors = [
    '#3B82F6', // Bleu
    '#10B981', // Vert
    '#F59E0B', // Orange
    '#EF4444', // Rouge
    '#FBBF24', // Jaune
    '#06B6D4', // Cyan
    '#84CC16', // Vert lime
    '#F97316', // Orange
    '#EC4899', // Rose
    '#6366F1', // Indigo
  ]
}) => {
  // Get responsive props
  const responsiveProps = useResponsiveChart()
  
  // Use responsive props or overrides
  const height = heightOverride ?? responsiveProps.height
  const leftMargin = leftMarginOverride ?? responsiveProps.leftMargin
  const padding = paddingOverride ?? responsiveProps.padding
  const fontSize = responsiveProps.fontSize
  const tickFontSize = responsiveProps.tickFontSize
  
  // Adjust margins based on responsive props
  const margin = useResponsive
    ? {
        top: responsiveProps.topMargin,
        right: responsiveProps.rightMargin,
        bottom: responsiveProps.bottomMargin,
        left: leftMargin,
      }
    : {
        top: 50,
        right: 130,
        bottom: 80,
        left: leftMargin,
      }

  // Transformer les données pour Nivo
  const chartData = data.map((item, index) => ({
    id: truncateLegendName(item.name, 24), // Tronquer pour l'affichage
    value: item.totalAmount,
    name: item.name, // Garder le nom complet pour le tooltip et les clics
    color: colors[index % colors.length],
  }))

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveBar
        data={chartData}
        keys={['value']}
        indexBy="id"
        margin={margin}
        padding={padding}
        layout="horizontal"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={(d) => d.data.color}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: (value) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)} M€`
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(0)} K€`
            }
            return `${value.toLocaleString()} €`
          },
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendPosition: 'middle',
          legendOffset: -40,
          format: (value) => {
            // Tronquer tous les noms à 24 caractères maximum
            return truncateLegendName(value, 24)
          },
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        tooltip={({ value, data: tooltipData }) => {
          // Calculer le total : utiliser totalForPercentage si fourni, sinon somme des données
          const totalAmount = totalForPercentage ?? chartData.map(d => d.value).reduce((sum, val) => sum + val, 0)
          const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0'
          
          return (
            <RefinedTooltip
              title={tooltipData.name as string}
              value={Number(value)}
              percentage={percentage}
              color={tooltipData.color as string}
            />
          )
        }}
        theme={{
          background: 'transparent',
          text: {
            fontSize: fontSize,
            fill: '#6B7280',
            fontFamily: 'inherit',
          },
          axis: {
            domain: {
              line: {
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
            },
            ticks: {
              line: {
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
              text: {
                fill: '#1e3a8a', // Bleu foncé (blue-900)
                fontSize: tickFontSize,
              },
            },
          },
          grid: {
            line: {
              stroke: '#f3f4f6',
              strokeWidth: 1,
            },
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
        motionConfig="gentle"
        enableLabel={false}
        isInteractive={true}
        onClick={(bar) => {
          // Appeler le handler parent si fourni
          if (onBarClick && bar.data) {
            const barData = {
              ...bar.data,
              name: bar.data.name as string,
              value: bar.data.value as number,
            }
            onBarClick(barData)
          }
        }}
      />
    </div>
  )
}

