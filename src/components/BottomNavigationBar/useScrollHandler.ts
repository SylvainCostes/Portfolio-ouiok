import { useRef } from 'react'

const OFFSET = 32
const NAV_BAR_HEIGHT = 58

const useScrollHandler = (navRef: React.RefObject<HTMLDivElement | null>) => {
  const navBottom = useRef(OFFSET)
  const offset = useRef(OFFSET)
  const previousScrollY = useRef(0)

  const handleScroll = () => {
    if (document.body.classList.contains('disable-scroll')) {
      // Update previousScrollY to current position to prevent jumps when re-enabled
      previousScrollY.current = window.scrollY
      return
    }
    if (!navRef.current) return

    // Sync with external changes to bottom position
    const currentBottom = parseInt(navRef.current.style.bottom || '0', 10)
    if (Math.abs(currentBottom - navBottom.current) > 1) {
      navBottom.current = currentBottom
    }

    const currentScrollY = window.scrollY
    const deltaScroll = currentScrollY - previousScrollY.current

    // handle condition when the initial scroll position != 0
    if (deltaScroll > NAV_BAR_HEIGHT && previousScrollY.current === 0) {
      return (previousScrollY.current = currentScrollY)
    }

    // scroll down
    if (deltaScroll > 0) {
      navBottom.current = Math.max(
        navBottom.current - deltaScroll,
        -(navRef.current.clientHeight || NAV_BAR_HEIGHT)
      )
    } else {
      navBottom.current = Math.min(
        navBottom.current - deltaScroll,
        offset.current
      )
    }

    navRef.current.style.bottom = `${navBottom.current}px`

    previousScrollY.current = currentScrollY
  }

  const setInitialPosition = () => {
    if (!navRef.current) return

    const computedStyle = getComputedStyle(navRef.current)
    const bottomNavBarOffset =
      Number(
        computedStyle
          .getPropertyValue('--bottom-nav-bar-offset')
          .replace('px', '')
      ) || OFFSET
    navBottom.current = bottomNavBarOffset
    offset.current = bottomNavBarOffset
  }

  return { handleScroll, setInitialPosition }
}

export default useScrollHandler
