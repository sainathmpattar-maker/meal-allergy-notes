import React, { useEffect, useRef, useState } from 'react'

export function useReveal(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Immediate show if reduced motion is preferred or observer not supported
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      { threshold: options.threshold || 0.1, rootMargin: options.rootMargin || '0px 0px -40px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [options.threshold, options.rootMargin])

  return [ref, isVisible]
}

export default function Reveal({
  children,
  delay = 0,
  className = '',
  as: Component = 'div',
  ...rest
}) {
  const [ref, isVisible] = useReveal()

  const combinedClass = `reveal-box ${isVisible ? 'is-revealed' : ''} ${className}`.trim()
  const inlineStyle = delay ? { transitionDelay: `${delay}ms` } : undefined

  return (
    <Component ref={ref} className={combinedClass} style={inlineStyle} {...rest}>
      {children}
    </Component>
  )
}

