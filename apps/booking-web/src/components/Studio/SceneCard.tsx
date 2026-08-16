import { Link } from 'react-router'
import type { Scene } from '@studio/shared'

export function SceneCard({ scene }: { scene: Scene }) {
  return (
    <Link
      to={`/scenes/${scene.slug}`}
      className="group block overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-raised"
    >
      <div className="aspect-square w-full overflow-hidden bg-sunken">
        {scene.coverUrl && (
          <img
            src={scene.coverUrl}
            alt={scene.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-ink">{scene.name}</h3>
        {scene.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {scene.tags.map((t) => (
              <span key={t} className="rounded-md bg-sunken px-2 py-0.5 text-[11px] text-ink-2">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
