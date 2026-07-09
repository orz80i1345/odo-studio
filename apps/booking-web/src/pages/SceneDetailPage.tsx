import { Link, useParams } from 'react-router'
import { Spinner } from '@studio/shared'
import { useScene } from '../hooks/useScenes'
import { useStudio } from '../hooks/useStudios'

export function SceneDetailPage() {
  const { sceneSlug } = useParams<{ sceneSlug: string }>()
  const { data: scene, isLoading } = useScene(sceneSlug)
  const { data: studio } = useStudio(scene?.studioId)

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!scene) return <p className="py-16 text-center text-ink-2">找不到佈景。</p>

  return (
    <article className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-3">Scene</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">{scene.name}</h1>
        {scene.description && <p className="mt-3 max-w-2xl text-ink-2">{scene.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {scene.tags.map((t) => (
            <span key={t} className="rounded-md bg-sunken px-2 py-0.5 text-xs text-ink-2">{t}</span>
          ))}
        </div>
      </header>

      {/* gallery */}
      <div className="grid gap-4 md:grid-cols-2">
        {scene.images.map((img) => (
          <div key={img.id} className="overflow-hidden rounded-xl border border-line bg-sunken">
            <img src={img.url} alt={img.altText ?? scene.name} className="size-full object-cover" />
          </div>
        ))}
      </div>

      {/* 屬於哪個 studio + CTA */}
      {studio && (
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface p-6">
          <div>
            <p className="text-xs text-ink-3">此佈景屬於</p>
            <Link to={`/studios/${studio.slug}`} className="font-serif text-xl text-ink hover:text-brand">
              {studio.name}
            </Link>
          </div>
          <Link
            to={`/book/${studio.id}`}
            className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover"
          >
            預約此空間
          </Link>
        </div>
      )}
    </article>
  )
}
