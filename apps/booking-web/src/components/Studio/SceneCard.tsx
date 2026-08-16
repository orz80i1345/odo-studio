import { Link } from 'react-router'
import type { Scene } from '@studio/shared'

export function SceneCard({ scene }: { scene: Scene }) {
  return (
    <Link
      to={`/scenes/${scene.slug}`}
      className="group block"
    >
      <div className="aspect-square w-full overflow-hidden bg-sunken">
        {scene.coverUrl && (
          <img
            src={scene.coverUrl}
            alt={scene.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.025]"
          />
        )}
      </div>
      <div className="border-b border-line py-4">
        <h3 className="font-serif text-2xl leading-tight text-ink">{scene.name}</h3>
        {scene.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {scene.tags.map((t) => (
              <span key={t} className="text-[11px] uppercase tracking-[0.18em] text-ink-3">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
