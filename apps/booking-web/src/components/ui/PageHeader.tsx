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
    <header className={cn('grid gap-8 border-b border-line pb-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-5 text-[11px] uppercase tracking-[0.28em] text-ink-3">{eyebrow}</p>
        )}
        <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-ink md:text-7xl">{title}</h1>
        {subtitle && <p className="mt-7 max-w-2xl text-base leading-8 text-ink-2 md:text-lg">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
