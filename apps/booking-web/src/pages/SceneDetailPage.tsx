import { Link, useParams } from 'react-router'
import { Spinner } from '@studio/shared'
import { useScene } from '../hooks/useScenes'
import { useStudio } from '../hooks/useStudios'
import { SmartImage } from '../components/ui/SmartImage'

export function SceneDetailPage() {
  const { sceneSlug } = useParams<{ sceneSlug: string }>()
  const { data: scene, isLoading } = useScene(sceneSlug)
  const { data: studio } = useStudio(scene?.studioId)

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!scene) return <p className="py-16 text-center text-ink-2">找不到空間。</p>

  const images = scene.images.slice(0, 3)

  return (
    <article className="space-y-16 md:space-y-24">
      <header className="grid gap-8 border-b border-line pb-10 md:grid-cols-[1fr_0.9fr] md:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-ink-3">Space</p>
          <h1 className="mt-5 font-serif text-6xl font-medium leading-[0.95] text-ink md:text-8xl">{scene.name}</h1>
        </div>
        <div>
          {scene.description && <p className="max-w-md text-sm leading-8 text-ink-2">{scene.description}</p>}
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
          {scene.tags.map((t) => (
            <span key={t} className="border-b border-line text-[11px] uppercase tracking-[0.18em] text-ink-3">{t}</span>
          ))}
        </div>
        </div>
      </header>

      {/* gallery */}
      <div className="space-y-5">
        {images[0] && (
          <div className="relative aspect-[16/10] overflow-hidden bg-sunken">
            <SmartImage
              src={images[0].url}
              alt={images[0].altText ?? scene.name}
              priority
              className="size-full object-cover"
            />
          </div>
        )}
        {images.length > 1 && (
          <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
            {images.slice(1).map((img) => (
              <div key={img.id} className="relative aspect-[4/5] overflow-hidden bg-sunken">
                <SmartImage
                  src={img.url}
                  alt={img.altText ?? scene.name}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      {studio && (
        <div className="flex flex-col gap-6 border-y border-line py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-ink-3">Booking</p>
            <p className="mt-2 font-serif text-3xl text-ink">{studio.name}</p>
          </div>
          <Link
            to={`/book/${studio.id}`}
            className="inline-flex w-fit border-b border-line-strong pb-1 text-xs uppercase tracking-[0.22em] text-ink-2 transition-colors duration-500 hover:text-ink"
          >
            Book this space →
          </Link>
        </div>
      )}
    </article>
  )
}
