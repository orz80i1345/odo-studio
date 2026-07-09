/**
 * PageHeader — 頁首標題。走 serif 字體，留白多、字大。
 */
import type { ReactNode } from 'react'
import { cn } from '@studio/shared'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-end justify-between gap-6 border-b border-line pb-6', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ink-3">{eyebrow}</p>
        )}
        <h1 className="font-serif text-3xl leading-tight text-ink md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
