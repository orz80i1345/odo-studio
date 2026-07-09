/**
 * HomePage — 首頁。
 * 不做 SaaS landing。走「雜誌封面 + 空間預告」的路線：
 *   1. Hero：大留白、Serif 主標、副標、單一 CTA
 *   2. 三段小介紹（自然光 / 佈景 / 預約）
 *   3. 精選攝影棚（用真的 studios list）
 */
import { Link } from 'react-router'
import { useStudios } from '../hooks/useStudios'
import { StudioCard } from '../components/Studio/StudioCard'

export function HomePage() {
  const { data } = useStudios()
  return (
    <div className="space-y-24 md:space-y-32">
      {/* Hero */}
      <section className="py-8 md:py-16">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-ink-3">河日 · Ode Studio</p>
        <h1 className="max-w-3xl font-serif text-4xl leading-[1.2] text-ink md:text-6xl">
          光落下的方式，<br />
          決定了空間的樣子。
        </h1>
        <p className="mt-6 max-w-xl text-ink-2 md:text-lg">
          我們是一個位於河岸公寓樓層的攝影棚。沒有太多的裝飾，
          只把自然光與少數佈景留在原地，等你把想拍的東西帶進來。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/studios"
            className="inline-flex h-11 items-center rounded-lg bg-brand px-6 text-sm font-medium text-brand-on hover:bg-brand-hover"
          >
            看看空間
          </Link>
          <Link to="/pricing" className="text-sm text-ink-2 hover:text-ink underline underline-offset-4">
            價格方案 →
          </Link>
        </div>
      </section>

      {/* 三段小介紹 */}
      <section className="grid gap-8 border-t border-line pt-10 md:grid-cols-3">
        <Feature
          eyebrow="Ⅰ · 光"
          title="自然光為主"
          body="面向淡水河的北向窗，全日皆為柔和光；下午的斜光落在磨石地上，是我們最喜歡的時刻。"
        />
        <Feature
          eyebrow="Ⅱ · 景"
          title="少而剛好的佈景"
          body="白紗、木長椅、藤傢俱、幾株植物。空間留白是刻意的，讓每個作品有各自的空氣感。"
        />
        <Feature
          eyebrow="Ⅲ · 約"
          title="安靜的預約流程"
          body="線上選日、選時段、確認即可。預約前一天，門鎖密碼會自動寄到你信箱。"
        />
      </section>

      {/* 精選攝影棚 */}
      <section className="space-y-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-3xl text-ink">精選空間</h2>
          <Link to="/studios" className="text-sm text-ink-2 hover:text-ink">
            所有空間 →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {data?.items.slice(0, 2).map((s) => <StudioCard key={s.id} studio={s} />)}
        </div>
      </section>
    </div>
  )
}

function Feature({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-ink-3">{eyebrow}</p>
      <h3 className="font-serif text-xl text-ink">{title}</h3>
      <p className="mt-3 text-ink-2">{body}</p>
    </div>
  )
}
