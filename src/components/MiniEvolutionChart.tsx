'use client'
import React from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RefinedTooltip } from './RefinedTooltip'

interface MiniEvolutionChartProps {
  data: Array<{ year: string; amount: number }>
  height?: number
  width?: number
  className?: string
}

/**
 * Mini graphique sparkline pour afficher l'évolution temporelle
 * Design ultra-léger et compact avec quelques infos clés
 */
export const MiniEvolutionChart: React.FC<MiniEvolutionChartProps> = ({
  data,
  height = 50,
  className = '',
}) => {
  // Calculer la tendance pour la couleur
  const getTrendColor = () => {
    if (data.length < 2) return '#3B82F6' // Bleu par défaut
    
    const first = data[0].amount
    const last = data[data.length - 1].amount
    const variation = ((last - first) / first) * 100
    
    if (variation > 10) return '#10B981' // Vert: croissance forte
    if (variation > 0) return '#84CC16' // Vert clair: croissance modérée
    if (variation > -10) return '#F59E0B' // Orange: légère baisse
    return '#EF4444' // Rouge: baisse importante
  }

  const trendColor = getTrendColor()

  // Calculer les infos à afficher
  const trendInfo = React.useMemo(() => {
    if (data.length < 2) {
      return { variation: 0, trend: '→', lastAmount: data[0]?.amount || 0 }
    }
    
    const first = data[0].amount
    const last = data[data.length - 1].amount
    const variation = ((last - first) / first) * 100
    
    let trend = '→'
    if (variation > 5) trend = '↑'
    else if (variation < -5) trend = '↓'
    
    return {
      variation: Math.abs(variation),
      trend,
      lastAmount: last,
      isPositive: variation >= 0,
    }
  }, [data])

  // Détecter si on est sur mobile (via window width si disponible)
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => setIsMobile(window.innerWidth < 640)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Formater les données pour le graphique
  const chartData = data.map(item => ({
    year: item.year,
    amount: item.amount,
    // Format court pour l'affichage
    label: item.year.length > 4 ? item.year.substring(2) : item.year,
  }))

  if (chartData.length === 0) {
    return null
  }

  // Formater le montant de la dernière année
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} M€`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)} K€`
    }
    return `${amount.toLocaleString('fr-FR')} €`
  }

  return (
    <div 
      className={`flex flex-col items-end gap-0.5 sm:gap-1 ${className}`}
      style={{ width: '100%', minHeight: isMobile ? '45px' : `${height}px` }}
    >
      {/* Infos discrètes en haut */}
      <div 
        className="flex items-center gap-1 sm:gap-2 text-xs" 
        style={{ height: isMobile ? '14px' : '16px' }}
      >
        {/* Tendance */}
        {data.length >= 2 && (
          <span 
            style={{ 
              color: trendColor,
              fontWeight: 600,
              fontSize: isMobile ? '9px' : '11px',
            }}
          >
            {trendInfo.trend} {trendInfo.variation.toFixed(1)}%
          </span>
        )}
        {/* Dernière année */}
        <span 
          style={{ 
            color: '#6B7280',
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: 500,
          }}
        >
          {data[data.length - 1]?.year || ''}
        </span>
      </div>
      
      {/* Graphique */}
      <div style={{ width: '100%', height: isMobile ? '40px' : `${height}px`, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis 
              dataKey="label" 
              hide={true}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              hide={true}
              axisLine={false}
              tickLine={false}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                
                const data = payload[0].payload as { year: string; amount: number }
                const index = chartData.findIndex(d => d.year === data.year)
                const isFirstHalf = index < chartData.length / 2
                
                // Positionner le tooltip en haut ou en bas selon la position sur le graphique
                const tooltipY = isFirstHalf ? -65 : 45
                
                return (
                  <div style={{ 
                    position: 'relative',
                    marginTop: `${tooltipY}px`,
                  }}>
                    {/* Tooltip */}
                    <RefinedTooltip
                      title={`Année ${data.year}`}
                      value={data.amount}
                      subtitle="Total des subsides"
                      color={trendColor}
                    />
                  </div>
                )
              }}
              cursor={{ stroke: trendColor, strokeWidth: 2, strokeDasharray: '4 4', opacity: 0.6 }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke={trendColor}
              strokeWidth={isMobile ? 1.5 : 2.5}
              dot={false}
              activeDot={{ 
                r: isMobile ? 4 : 5, 
                fill: trendColor,
                stroke: '#fff',
                strokeWidth: 2,
              }}
              isAnimationActive={true}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Montant dernière année en bas */}
      <div 
        className="text-right"
        style={{ 
          height: isMobile ? '12px' : '14px',
          fontSize: isMobile ? '9px' : '10px',
          color: '#374151',
          fontWeight: 600,
        }}
      >
        {formatAmount(trendInfo.lastAmount)}
      </div>
    </div>
  )
}

