/**
 * SceneMultiSelect — 確認頁的佈景多選。走 chips 樣式。
 */
import type { ID, Scene } from '@studio/shared'
import { cn } from '@studio/shared'

interface Props {
  scenes: Scene[]
  value: ID[]
  onChange: (ids: ID[]) => void
}

export function SceneMultiSelect({ scenes, value, onChange }: Props) {
  if (scenes.length === 0) return null
  const toggle = (id: ID) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <div className="flex flex-wrap gap-2">
      {scenes.map((s) => {
        const active = value.includes(s.id)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.id)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors',
              active
                ? 'bg-brand-subtle text-brand-subtle-ink border-brand-subtle-ink'
                : 'bg-surface text-ink-2 border-line hover:border-line-strong',
            )}
          >
            {s.name}
          </button>
        )
      })}
    </div>
  )
}
