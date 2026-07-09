import type { ReactNode } from 'react'

interface Props { title: string; description?: string; action?: ReactNode }

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-xl border border-line bg-surface py-16 text-center">
      <p className="font-serif text-xl text-ink-2">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-ink-3">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
