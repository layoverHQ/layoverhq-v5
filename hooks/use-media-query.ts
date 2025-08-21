import { useState, useEffect } from 'react'

/**
 * Custom hook to detect media query changes
 * @param query - The media query string (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Define the event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add the listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener)
    }

    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener)
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(listener)
      }
    }
  }, [query])

  return matches
}

/**
 * Common breakpoint hooks for convenience
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1440px)')

/**
 * Responsive breakpoint hook that returns the current breakpoint
 */
export function useBreakpoint() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  const isLargeScreen = useIsLargeScreen()

  if (isLargeScreen) return 'xl'
  if (isDesktop) return 'lg'
  if (isTablet) return 'md'
  if (isMobile) return 'sm'
  return 'xs'
}

/**
 * Hook to detect device orientation
 */
export function useOrientation() {
  const isPortrait = useMediaQuery('(orientation: portrait)')
  return isPortrait ? 'portrait' : 'landscape'
}

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Hook to detect if user prefers dark mode
 */
export function usePrefersDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)')
}