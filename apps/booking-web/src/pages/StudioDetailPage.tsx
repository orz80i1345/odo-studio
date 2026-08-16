import { Link, useParams } from 'react-router'
import { Calendar } from 'lucide-react'
import { Spinner } from '@studio/shared'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { SceneCard } from '../components/Studio/SceneCard'

export function StudioDetailPage() {
  const { studioSlug } = useParams<{ studioSlug: string }>()
  const { data: studio, isLoading } = useStudio(studioSlug)
  const { data: scenes } = useScenes(studio?.id)

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!studio) return <p className="py-16 text-center text-ink-2">找不到攝影棚。</p>

  const scenesOfStudio = scenes?.items ?? []

  return (
    <article className="space-y-20 md:space-y-28">
      {/* 主圖 */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-sunken">
        <div className="aspect-[16/9] w-full">
          {studio.coverUrl && <img src={studio.coverUrl} alt={studio.name} className="size-full object-cover" />}
        </div>
      </div>

      {/* 資訊 + CTA */}
      <div className="grid gap-14 md:grid-cols-[minmax(0,1fr)_340px] md:gap-20">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">Studio</p>
          <h1 className="mt-6 max-w-3xl font-serif text-6xl leading-[0.95] text-ink md:text-8xl">{studio.name}</h1>
          <p className="mt-8 max-w-2xl whitespace-pre-line text-base leading-8 text-ink-2">{studio.description}</p>

          <dl className="mt-12 grid grid-cols-2 gap-x-10 gap-y-6 border-t border-line pt-8 text-sm">
            <Info label="地址" value={studio.address ?? '—'} />
            <Info label="樓層" value={studio.floor ?? '—'} />
            <Info label="坪數" value={`${studio.areaPing} 坪`} />
            <Info label="容納" value={studio.capacity ? `至多 ${studio.capacity} 人` : '—'} />
          </dl>

          <div className="mt-10">
            <p className="mb-4 text-[11px] uppercase tracking-[0.28em] text-ink-3">Facilities</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {studio.features.map((f) => (
                <li key={f} className="border-b border-line text-sm leading-7 text-ink-2">{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 側欄：CTA */}
        <aside className="h-fit border-y border-line py-8">
          <div className="text-[11px] uppercase tracking-[0.24em] text-ink-3">Starting from</div>
          <div className="mt-4 font-serif text-5xl leading-none text-ink">
            NT$ {studio.defaultHourlyPrice.toLocaleString()}
            <span className="text-base text-ink-3"> / hr</span>
          </div>
          <p className="mt-5 text-sm leading-7 text-ink-2">
            最少 {studio.minBookingMinutes / 60} 小時；每 {studio.bookingIncrementMinutes} 分鐘為一單位。
          </p>
          <Link
            to={`/book/${studio.id}`}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 border border-ink bg-transparent text-xs uppercase tracking-[0.2em] text-ink transition-colors duration-500 hover:bg-ink hover:text-ink-on"
          >
            <Calendar className="size-4" />
            Book the space
          </Link>
          <p className="mt-4 text-center text-xs leading-6 text-ink-3">
            未登入將先導向登入頁，完成後回到預約流程。
          </p>
        </aside>
      </div>

      {/* 佈景 */}
      {scenesOfStudio.length > 0 && (
        <section className="space-y-12 border-t border-line pt-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">Scenes</p>
            <h2 className="mt-4 font-serif text-5xl text-ink">此空間的佈景</h2>
          </div>
          <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {scenesOfStudio.map((s) => <SceneCard key={s.id} scene={s} />)}
          </div>
        </section>
      )}
    </article>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.18em] text-ink-3">{label}</dt>
      <dd className="mt-2 text-ink">{value}</dd>
    </div>
  )
}
