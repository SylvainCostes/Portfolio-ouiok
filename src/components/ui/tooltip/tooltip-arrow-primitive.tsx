import { useAstroEffect } from '@/hooks/useAstroEffect'
import { Arrow } from '@radix-ui/react-tooltip'
import React from 'react'

const TooltipArrowPrimitive = () => {
  const arrowRef = React.useRef<SVGSVGElement>(null)

  useAstroEffect(() => {
    const spanArrow = arrowRef.current?.parentElement

    const observer = new MutationObserver(() => {
      if (!spanArrow) return

      const style = getComputedStyle(spanArrow)
      const tooltipArrow = document.getElementById('tooltip-arrow')

      tooltipArrow?.setAttribute('style', `left: ${style.left};`)
    })

    if (spanArrow) {
      observer.observe(spanArrow, {
        attributes: true, // Observe changes to attributes
        attributeFilter: ['style'] // Only look for changes to the style attribute
      })
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return <Arrow ref={arrowRef} id='primitive-arrow' className='opacity-0' />
}

export default TooltipArrowPrimitive
