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
          <p className="mb-5 text-[10px] uppercase tracking-[0.34em] text-ink-3">{eyebrow}</p>
        )}
        <h1 className="max-w-3xl font-serif text-5xl font-medium leading-[0.98] text-ink md:text-6xl">{title}</h1>
        {subtitle && <p className="mt-7 max-w-xl text-sm leading-7 text-ink-2 md:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
