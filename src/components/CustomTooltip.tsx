import React from 'react'
import { RefinedTooltip } from './RefinedTooltip'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    dataKey?: string
    color?: string
  }>
  label?: string
  formatter?: (value: number, name?: string) => [string, string]
  labelFormatter?: (label: string) => string
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const formattedLabel = labelFormatter ? labelFormatter(label || '') : label
  const firstEntry = payload[0]
  
  if (!firstEntry) {
    return null
  }

  const [formattedValue, formattedName] = formatter
    ? formatter(firstEntry.value || 0, firstEntry.name)
    : [
        `${Number(firstEntry.value || 0).toLocaleString()}`,
        firstEntry.name || firstEntry.dataKey || '',
      ]

  // Si plusieurs valeurs, afficher la première avec les autres en subtitle
  const otherValues = payload.length > 1
    ? payload.slice(1).map(entry => {
        const [val, name] = formatter
          ? formatter(entry.value || 0, entry.name)
          : [
              `${Number(entry.value || 0).toLocaleString()}`,
              entry.name || entry.dataKey || '',
            ]
        return `${name}: ${val}`
      }).join(' • ')
    : undefined

  return (
    <RefinedTooltip
      title={formattedLabel ? String(formattedLabel) : formattedName}
      value={formattedValue}
      subtitle={otherValues}
      color={firstEntry.color}
    />
  )
}
