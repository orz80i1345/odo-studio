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
    <div className="space-y-28 md:space-y-40">
      {/* Hero */}
      <section className="relative left-1/2 -mt-14 min-h-[calc(100vh-5rem)] w-screen -translate-x-1/2 overflow-hidden bg-sunken md:-mt-20">
        <video
          className="absolute inset-0 size-full object-cover"
          src="/media/adobestock_1155955252.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[#40372f]/32" />
        <div className="relative flex min-h-[calc(100vh-5rem)] items-end px-5 pb-14 pt-28 md:px-10 md:pb-20">
          <div className="w-full max-w-7xl">
            <p className="mb-7 text-[11px] uppercase tracking-[0.34em] text-white/75">河日 · Ode Studio</p>
            <h1 className="max-w-5xl font-serif text-6xl leading-[0.9] text-white md:text-8xl lg:text-9xl">
              A quiet space<br />
              shaped by light.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-white/82 md:ml-[28vw] md:text-lg">
              我們是一個位於河岸公寓樓層的攝影棚。沒有太多的裝飾，
              只把自然光與少數佈景留在原地，等你把想拍的東西帶進來。
            </p>
            <div className="mt-9 md:ml-[28vw]">
              <Link
                to="/studios"
                className="inline-flex border-b border-white/70 pb-1 text-xs uppercase tracking-[0.26em] text-white transition-colors duration-500 hover:border-white hover:text-white"
              >
                Enter the space →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 三段小介紹 */}
      <section className="grid gap-12 border-t border-line pt-14 md:grid-cols-[0.8fr_1fr_1fr] md:gap-16">
        <Feature
          eyebrow="01 / Light"
          title="自然光為主"
          body="面向淡水河的北向窗，全日皆為柔和光；下午的斜光落在磨石地上，是我們最喜歡的時刻。"
        />
        <Feature
          eyebrow="02 / Scenes"
          title="少而剛好的佈景"
          body="白紗、木長椅、藤傢俱、幾株植物。空間留白是刻意的，讓每個作品有各自的空氣感。"
        />
        <Feature
          eyebrow="03 / Booking"
          title="安靜的預約流程"
          body="線上選日、選時段、確認即可。預約前一天，門鎖密碼會自動寄到你信箱。"
        />
      </section>

      <section className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-end md:gap-20">
        <div className="md:pb-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">Editorial Note</p>
          <h2 className="mt-6 max-w-xl font-serif text-5xl leading-[1.02] text-ink md:text-7xl">
            留下空氣，讓畫面自己說話。
          </h2>
        </div>
        <p className="max-w-md justify-self-end text-base leading-8 text-ink-2">
          河日不是把每一寸填滿的棚。它更像一間被陽光整理過的房間，材質、牆面與影子都保持安靜，讓人、物件與作品成為畫面的中心。
        </p>
      </section>

      {/* 精選攝影棚 */}
      <section className="space-y-12">
        <div className="flex items-end justify-between border-t border-line pt-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">04 / Space</p>
            <h2 className="mt-4 font-serif text-5xl text-ink md:text-6xl">精選空間</h2>
          </div>
          <Link to="/studios" className="hidden border-b border-line-strong pb-1 text-xs uppercase tracking-[0.22em] text-ink-2 transition-colors duration-500 hover:text-ink md:inline-flex">
            All spaces →
          </Link>
        </div>
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          {data?.items.slice(0, 2).map((s) => <StudioCard key={s.id} studio={s} />)}
        </div>
      </section>
    </div>
  )
}

function Feature({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="mb-5 text-[11px] uppercase tracking-[0.28em] text-ink-3">{eyebrow}</p>
      <h3 className="font-serif text-3xl leading-tight text-ink">{title}</h3>
      <p className="mt-5 leading-8 text-ink-2">{body}</p>
    </div>
  )
}
