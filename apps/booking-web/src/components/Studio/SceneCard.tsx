import { Link } from 'react-router'
import type { Scene } from '@studio/shared'
import { SmartImage } from '../ui/SmartImage'

export function SceneCard({ scene, priority = false }: { scene: Scene; priority?: boolean }) {
  return (
    <Link
      to={`/spaces/${scene.id}`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden bg-sunken">
        {scene.coverUrl && (
          <SmartImage
            src={scene.coverUrl}
            alt={scene.name}
            priority={priority}
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
