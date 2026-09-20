import { useState } from 'react'
import { cn } from '@studio/shared'

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function SmartImage({ src, alt, className, priority = false }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sunken via-surface to-sunken" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={() => setLoaded(true)}
        className={cn(
          'relative size-full object-cover opacity-0 transition-opacity duration-500',
          loaded && 'opacity-100',
          className,
        )}
      />
    </>
  )
}
