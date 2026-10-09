import { useEffect, useRef, useState } from 'react'
import { cn } from '@studio/shared'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function SmartImage({ src, alt, className, priority = false }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)
  const revealFrame = useRef<number | undefined>(undefined)

  useEffect(() => {
    setLoaded(false)
    return () => {
      if (revealFrame.current !== undefined) cancelAnimationFrame(revealFrame.current)
    }
  }, [src])

  function reveal() {
    // 先讓已下載的圖片以模糊狀態繪製一幀，再開始轉清晰。
    revealFrame.current = requestAnimationFrame(() => {
      revealFrame.current = requestAnimationFrame(() => setLoaded(true))
    })
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-sunken via-surface to-sunken transition-opacity duration-700',
          loaded ? 'opacity-0' : 'animate-pulse opacity-100',
        )}
      />
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={reveal}
        className={cn(
          'relative size-full object-cover transition-[filter,opacity,transform] duration-500 ease-out motion-reduce:transition-none',
          loaded
            ? 'scale-100 opacity-100 blur-none'
            : 'scale-[1.025] opacity-70 blur-md',
          className,
        )}
      />
    </>
  )
}
