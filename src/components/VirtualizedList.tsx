'use client'
/**
 * Virtualized List Component
 * 
 * Provides virtual scrolling for large lists to improve performance.
 * Uses @tanstack/react-virtual for efficient rendering of large datasets.
 */

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useMemo } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  estimateSize?: number
  overscan?: number
  className?: string
  containerClassName?: string
  emptyMessage?: string
}

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 200,
  overscan = 5,
  className = '',
  containerClassName = '',
  emptyMessage = 'Aucun élément à afficher',
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const itemsToRender = useMemo(() => {
    return virtualizer.getVirtualItems()
  }, [virtualizer])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${containerClassName}`}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${containerClassName}`}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <div
        className={className}
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {itemsToRender.map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Hook for virtual scrolling with grid layout
 */
export function useVirtualGrid<T>({
  items,
  estimateSize = 200,
  overscan = 5,
}: {
  items: T[]
  estimateSize?: number
  overscan?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  return {
    parentRef,
    virtualizer,
    items: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
  }
}

