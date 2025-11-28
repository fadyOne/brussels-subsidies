/**
 * Custom hook for responsive chart dimensions
 * 
 * Provides responsive props for charts based on screen size:
 * - Margins (left, right, top, bottom)
 * - Heights
 * - Font sizes
 * - Padding
 * 
 * Uses standard Tailwind breakpoints:
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 */

import { useEffect, useState } from 'react'

export interface ResponsiveChartProps {
  height: number
  leftMargin: number
  rightMargin: number
  topMargin: number
  bottomMargin: number
  fontSize: number
  tickFontSize: number
  padding: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

/**
 * Hook to get responsive chart properties based on screen size
 */
export function useResponsiveChart(): ResponsiveChartProps {
  const [props, setProps] = useState<ResponsiveChartProps>(() => {
    // Initial values (desktop default)
    if (typeof window === 'undefined') {
      return getDesktopProps()
    }
    return getResponsiveProps(window.innerWidth)
  })

  useEffect(() => {
    const handleResize = () => {
      setProps(getResponsiveProps(window.innerWidth))
    }

    // Debounce resize events
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener('resize', debouncedResize)
    
    // Initial check
    handleResize()

    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return props
}

/**
 * Get responsive props based on window width
 */
function getResponsiveProps(width: number): ResponsiveChartProps {
  if (width < 640) {
    // Mobile (< 640px)
    return getMobileProps()
  } else if (width < 1024) {
    // Tablet (640px - 1023px)
    return getTabletProps()
  } else {
    // Desktop (>= 1024px)
    return getDesktopProps()
  }
}

/**
 * Mobile props (< 640px)
 * - Smaller margins to maximize chart area
 * - Reduced height for better fit
 * - Smaller fonts for readability
 */
function getMobileProps(): ResponsiveChartProps {
  return {
    height: 300,
    leftMargin: 60, // Reduced for shorter names or truncation
    rightMargin: 20,
    topMargin: 30,
    bottomMargin: 50,
    fontSize: 10,
    tickFontSize: 9,
    padding: 0.4,
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  }
}

/**
 * Tablet props (640px - 1023px)
 * - Medium margins
 * - Medium height
 * - Medium fonts
 */
function getTabletProps(): ResponsiveChartProps {
  return {
    height: 400,
    leftMargin: 100,
    rightMargin: 50,
    topMargin: 40,
    bottomMargin: 60,
    fontSize: 11,
    tickFontSize: 10,
    padding: 0.5,
    isMobile: false,
    isTablet: true,
    isDesktop: false,
  }
}

/**
 * Desktop props (>= 1024px)
 * - Full margins for long names
 * - Full height for detail
 * - Standard fonts
 */
function getDesktopProps(): ResponsiveChartProps {
  return {
    height: 500,
    leftMargin: 150,
    rightMargin: 130,
    topMargin: 50,
    bottomMargin: 80,
    fontSize: 12,
    tickFontSize: 11,
    padding: 0.3,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }
}

