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
    <article className="space-y-12">
      {/* 主圖 */}
      <div className="overflow-hidden rounded-xl border border-line bg-sunken">
        <div className="aspect-[16/9] w-full">
          {studio.coverUrl && <img src={studio.coverUrl} alt={studio.name} className="size-full object-cover" />}
        </div>
      </div>

      {/* 資訊 + CTA */}
      <div className="grid gap-10 md:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-3">Studio</p>
          <h1 className="mt-2 font-serif text-4xl text-ink">{studio.name}</h1>
          <p className="mt-4 whitespace-pre-line text-ink-2">{studio.description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <Info label="地址" value={studio.address ?? '—'} />
            <Info label="樓層" value={studio.floor ?? '—'} />
            <Info label="坪數" value={`${studio.areaPing} 坪`} />
            <Info label="容納" value={studio.capacity ? `至多 ${studio.capacity} 人` : '—'} />
          </dl>

          <div className="mt-6">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-3">設備</p>
            <ul className="flex flex-wrap gap-2">
              {studio.features.map((f) => (
                <li key={f} className="rounded-md bg-sunken px-2.5 py-1 text-sm text-ink-2">{f}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 側欄：CTA */}
        <aside className="h-fit rounded-xl border border-line bg-surface p-6">
          <div className="text-xs text-ink-3">單位價</div>
          <div className="mt-1 font-serif text-3xl text-ink">
            NT$ {studio.defaultHourlyPrice.toLocaleString()}
            <span className="text-base text-ink-3"> / 小時</span>
          </div>
          <p className="mt-3 text-xs text-ink-3">
            最少 {studio.minBookingMinutes / 60} 小時；每 {studio.bookingIncrementMinutes} 分鐘為一單位。
          </p>
          <Link
            to={`/book/${studio.id}`}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-medium text-brand-on hover:bg-brand-hover"
          >
            <Calendar className="size-4" />
            預約這個空間
          </Link>
          <p className="mt-3 text-center text-xs text-ink-3">
            未登入將先導向登入頁，完成後回到預約流程。
          </p>
        </aside>
      </div>

      {/* 佈景 */}
      {scenesOfStudio.length > 0 && (
        <section className="space-y-6 border-t border-line pt-10">
          <h2 className="font-serif text-2xl text-ink">此空間的佈景</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  )
}
