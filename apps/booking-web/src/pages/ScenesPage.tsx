import { Spinner } from '@studio/shared'
import { Link } from 'react-router'
import type { Scene } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { SmartImage } from '../components/ui/SmartImage'
import { useScenes } from '../hooks/useScenes'

export function ScenesPage() {
  const { data, isLoading } = useScenes()
  return (
    <div className="space-y-16 md:space-y-24">
      <PageHeader
        eyebrow="01 / Spaces"
        title="空間介紹"
        subtitle="每個空間保留不同的光線、材質與比例。預約時可以選擇單一空間，或選擇包場保留整個場地。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div className="space-y-20 md:space-y-28">
        {data?.items.map((scene, index) => (
          <SceneFeature key={scene.id} scene={scene} index={index} />
        ))}
      </div>
    </div>
  )
}

function SceneFeature({ scene, index }: { scene: Scene; index: number }) {
  const reversed = index % 2 === 1
  return (
    <Link
      to={`/spaces/${scene.id}`}
      className="group grid gap-8 border-t border-line pt-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-14"
    >
      <div className={reversed ? 'md:order-2' : undefined}>
        <div className="relative aspect-[4/5] overflow-hidden bg-sunken md:aspect-[3/4]">
          {scene.coverUrl && (
            <SmartImage
              src={scene.coverUrl}
              alt={scene.name}
              priority={index < 2}
              className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.025]"
            />
          )}
        </div>
      </div>
      <div className="max-w-md">
        <p className="text-[10px] uppercase tracking-[0.32em] text-ink-3">
          Space {String(index + 1).padStart(2, '0')}
        </p>
        <h2 className="mt-5 font-serif text-5xl font-medium leading-[0.98] text-ink md:text-6xl">{scene.name}</h2>
        {scene.description && (
          <p className="mt-6 text-sm leading-8 text-ink-2">{scene.description}</p>
        )}
        {scene.tags.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2">
            {scene.tags.map((tag) => (
              <span key={tag} className="border-b border-line text-[11px] uppercase tracking-[0.18em] text-ink-3">
                {tag}
              </span>
            ))}
          </div>
        )}
        <span className="mt-9 inline-flex border-b border-line-strong pb-1 text-xs uppercase tracking-[0.22em] text-ink-2 transition-colors duration-500 group-hover:text-ink">
          View space →
        </span>
      </div>
    </Link>
  )
}
