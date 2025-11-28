'use client'
import React from 'react'

interface RefinedTooltipProps {
  title: string
  value: number | string
  percentage?: string
  rank?: number
  subtitle?: string
  color?: string
}

/**
 * Tooltip raffiné et compact pour les graphiques
 * Design moderne avec ombre subtile et typographie soignée
 */
export const RefinedTooltip: React.FC<RefinedTooltipProps> = ({
  title,
  value,
  percentage,
  rank,
  subtitle,
  color,
}) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(8px)',
        padding: '8px 12px',
        border: '1px solid rgba(229, 231, 235, 0.8)',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        margin: 0,
        minWidth: '140px',
        maxWidth: '220px',
        fontSize: '12px',
        lineHeight: '1.4',
      }}
    >
      {/* Titre avec couleur d'accent si fournie */}
      <div
        style={{
          fontWeight: 600,
          marginBottom: '6px',
          color: '#111827',
          fontSize: '11px',
          letterSpacing: '-0.01em',
          lineHeight: '1.3',
          wordBreak: 'break-word',
        }}
      >
        {title}
      </div>

      {/* Valeur principale */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '6px',
          marginBottom: percentage || rank ? '4px' : '0',
        }}
      >
        <span
          style={{
            color: color || '#3B82F6',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '-0.02em',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </span>
        {typeof value === 'number' && (
          <span
            style={{
              color: '#6B7280',
              fontSize: '10px',
              fontWeight: 500,
            }}
          >
            €
          </span>
        )}
      </div>

      {/* Informations secondaires */}
      {(percentage || rank || subtitle) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '4px',
            paddingTop: '4px',
            borderTop: '1px solid rgba(229, 231, 235, 0.6)',
          }}
        >
          {percentage && (
            <span
              style={{
                color: '#6B7280',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              {percentage}%
            </span>
          )}
          {rank && (
            <span
              style={{
                color: '#9CA3AF',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              #{rank}
            </span>
          )}
          {subtitle && (
            <span
              style={{
                color: '#6B7280',
                fontSize: '10px',
                fontStyle: 'italic',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

