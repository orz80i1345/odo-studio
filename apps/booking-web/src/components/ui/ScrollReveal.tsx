import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@studio/shared'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  distance?: number
}

type RevealStyle = CSSProperties & {
  '--reveal-delay': string
  '--reveal-distance': string
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 36,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.unobserve(element)
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const style: RevealStyle = {
    '--reveal-delay': `${delay}ms`,
    '--reveal-distance': `${distance}px`,
  }

  return (
    <div
      ref={elementRef}
      className={cn('scroll-reveal', visible && 'scroll-reveal--visible', className)}
      style={style}
    >
      {children}
    </div>
  )
}
