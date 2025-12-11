import { useEffect, useState } from 'react'

export function useWaitForElement(id: string, timeout = 3000) {
  const [element, setElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Check if element already exists
    const existingElement = document.getElementById(id)
    if (existingElement) {
      setElement(existingElement)
      return
    }

    let observer: MutationObserver | null = null
    let timer: NodeJS.Timeout | null = null

    observer = new MutationObserver(() => {
      const el = document.getElementById(id)
      if (el) {
        setElement(el)
        observer?.disconnect()
        if (timer) clearTimeout(timer)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    timer = setTimeout(() => {
      setElement(null)
      observer?.disconnect()
    }, timeout)

    // Cleanup function
    return () => {
      if (observer) observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [id, timeout])

  return element
}
