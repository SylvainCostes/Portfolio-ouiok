import { useEffect, useRef } from 'react'

export function useAstroEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList = []
) {
  const cleanupRef = useRef<(() => void) | void>(null)

  useEffect(() => {
    const runEffect = () => {
      // Cleanup previous effect
      if (cleanupRef.current) {
        cleanupRef.current()
      }

      // Run new effect
      cleanupRef.current = effect()
    }

    // Run initially
    runEffect()

    // Re-run on Astro navigation
    const handleNavigation = () => {
      setTimeout(runEffect, 50)
    }

    document.addEventListener('astro:page-load', handleNavigation)
    document.addEventListener('astro:after-swap', handleNavigation)

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      document.removeEventListener('astro:page-load', handleNavigation)
      document.removeEventListener('astro:after-swap', handleNavigation)
    }
  }, deps)
}
