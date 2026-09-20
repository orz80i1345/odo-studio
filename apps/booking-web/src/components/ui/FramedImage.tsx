import type { ReactNode } from 'react'
import { cn } from '@studio/shared'

interface FramedImageProps {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export function FramedImage({ children, className, innerClassName }: FramedImageProps) {
  return (
    <div className={cn('bg-[oklch(0.915_0.026_82)] p-4 md:p-5', className)}>
      <div className={cn('relative overflow-hidden bg-sunken', innerClassName)}>
        {children}
      </div>
    </div>
  )
}
