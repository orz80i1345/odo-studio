/**
 * HomePage — 首頁。
 * 不做 SaaS landing。走「雜誌封面 + 空間預告」的路線：
 *   1. Hero：大留白、Serif 主標、副標、單一 CTA
 *   2. 三段小介紹（自然光 / 空間 / 預約）
 *   3. 精選空間（用真的 scenes list）
 */
import { useEffect, useRef } from 'react'
import { addMonths, format } from 'date-fns'
import { Link } from 'react-router'
import { availabilityApi, queryKeys } from '@studio/shared'
import { useStudios } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { SmartImage } from '../components/ui/SmartImage'
import { ScrollReveal } from '../components/ui/ScrollReveal'
import { api, queryClient } from '../lib'
import { isLineInAppBrowser } from '../utils/browser'

export function HomePage() {
  const { data } = useStudios()
  const studioId = data?.items[0]?.id
  const { data: scenes } = useScenes(studioId)
  const lineWebView = isLineInAppBrowser()
  const heroImage = scenes?.items.find((scene) => scene.coverUrl)?.coverUrl

  useEffect(() => {
    if (!studioId || lineWebView) return
    const timer = window.setTimeout(() => {
      const currentMonth = format(new Date(), 'yyyy-MM')
      const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM')
      for (const yearMonth of [currentMonth, nextMonth]) {
        void queryClient.prefetchQuery({
          queryKey: queryKeys.studios.availability(studioId, yearMonth),
          queryFn: () => availabilityApi.getMonthAvailability(api, studioId, yearMonth),
          staleTime: 60_000,
        })
      }
    }, 3_000)
    return () => window.clearTimeout(timer)
  }, [lineWebView, studioId])

  return (
    <div className="space-y-28 md:space-y-40">
      {/* Hero */}
      <section className="relative left-1/2 -mt-14 min-h-[calc(100vh-5rem)] w-screen -translate-x-1/2 overflow-hidden bg-sunken md:-mt-20">
        {lineWebView ? (
          heroImage && (
            <div className="absolute inset-0">
              <SmartImage src={heroImage} alt="河日攝影棚" priority />
            </div>
          )
        ) : (
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
        )}
        <div className="absolute inset-0 bg-[#40372f]/32" />
        <div className="relative flex min-h-[calc(100vh-5rem)] items-end px-5 pb-14 pt-28 md:px-10 md:pb-20">
          <div className="w-full max-w-7xl">
            <ScrollReveal distance={20}>
              <p className="mb-7 text-[11px] uppercase tracking-[0.34em] text-white/75">河日 · Ode Studio</p>
            </ScrollReveal>
            <ScrollReveal delay={90} distance={48}>
              <h1 className="max-w-5xl font-serif text-6xl font-medium leading-[0.9] text-white md:text-8xl lg:text-9xl">
                A quiet space<br />
                shaped by light.
              </h1>
            </ScrollReveal>
            <ScrollReveal className="md:ml-[28vw]" delay={190} distance={30}>
              <p className="mt-8 max-w-xl text-base leading-8 text-white/82 md:text-lg">
                我們是一個位於河岸公寓樓層的攝影棚。沒有太多的裝飾，
                只把自然光與少數空間留在原地，等你把想拍的東西帶進來。
              </p>
            </ScrollReveal>
            <ScrollReveal className="mt-9 md:ml-[28vw]" delay={270} distance={20}>
              <Link
                to="/spaces"
                className="inline-flex border-b border-white/70 pb-1 text-xs uppercase tracking-[0.26em] text-white transition-colors duration-500 hover:border-white hover:text-white"
              >
                Enter the space →
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 三段小介紹 */}
      <section className="grid gap-12 border-t border-line pt-14 md:grid-cols-[0.8fr_1fr_1fr] md:gap-16">
        <ScrollReveal distance={30}>
          <Feature
            eyebrow="01 / Light"
            title="自然光為主"
            body="面向淡水河的北向窗，全日皆為柔和光；下午的斜光落在磨石地上，是我們最喜歡的時刻。"
          />
        </ScrollReveal>
        <ScrollReveal delay={100} distance={30}>
          <Feature
            eyebrow="02 / Spaces"
            title="少而剛好的空間"
            body="白紗、木長椅、藤傢俱、幾株植物。空間留白是刻意的，讓每個作品有各自的空氣感。"
          />
        </ScrollReveal>
        <ScrollReveal delay={200} distance={30}>
          <Feature
            eyebrow="03 / Booking"
            title="安靜的預約流程"
            body="線上選日、選時段、確認即可。預約前一天，門鎖密碼會自動寄到你信箱。"
          />
        </ScrollReveal>
      </section>

      <section className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-end md:gap-20">
        <ScrollReveal className="md:pb-20" distance={44}>
          <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">Editorial Note</p>
          <h2 className="mt-6 max-w-xl font-serif text-5xl font-medium leading-[1.02] text-ink md:text-7xl">
            留下空氣，讓畫面自己說話。
          </h2>
        </ScrollReveal>
        <ScrollReveal className="max-w-md justify-self-end" delay={120} distance={30}>
          <p className="text-base leading-8 text-ink-2">
            河日不是把每一寸填滿的棚。它更像一間被陽光整理過的房間，材質、牆面與影子都保持安靜，讓人、物件與作品成為畫面的中心。
          </p>
        </ScrollReveal>
      </section>

      <ParallaxSpaceSection imageUrl={heroImage} />
    </div>
  )
}

function ParallaxSpaceSection({ imageUrl }: { imageUrl?: string }) {
  const sectionRef = useRef<HTMLElement>(null)
  const imageLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const imageLayer = imageLayerRef.current
    if (!section || !imageLayer) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      imageLayer.style.transform = 'translate3d(0, 0, 0) scale(1.08)'
      return
    }

    const lineWebView = isLineInAppBrowser()
    let visible = true
    let animationFrame: number | undefined

    const updatePosition = () => {
      animationFrame = undefined
      if (!visible) return
      const rect = section.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const sectionCenter = rect.top + rect.height / 2
      const viewportCenter = viewportHeight / 2
      const range = (viewportHeight + rect.height) / 2
      const progress = Math.max(-1, Math.min(1, (sectionCenter - viewportCenter) / range))
      const maxOffset = lineWebView ? 64 : window.innerWidth < 768 ? 140 : 240
      imageLayer.style.transform = `translate3d(0, ${progress * maxOffset}px, 0) scale(1.04)`
    }

    const requestUpdate = () => {
      if (animationFrame !== undefined) return
      animationFrame = window.requestAnimationFrame(updatePosition)
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      if (visible) requestUpdate()
    }, { rootMargin: '20% 0px' })

    observer.observe(section)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    requestUpdate()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
    }
  }, [imageUrl])

  return (
    <section
      ref={sectionRef}
      className="relative left-1/2 min-h-[68svh] w-screen -translate-x-1/2 overflow-hidden bg-ink md:min-h-[calc(100svh-4rem)]"
    >
      {imageUrl && (
        <div
          ref={imageLayerRef}
          className="absolute inset-x-0 -top-[30%] h-[160%] origin-center will-change-transform"
        >
          <SmartImage
            src={imageUrl}
            alt="河日攝影棚精選空間"
            className="grayscale contrast-[0.92] brightness-[0.82]"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-black/15" />
      <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
        <ScrollReveal distance={18}>
          <Link
            to="/spaces"
            className="inline-flex min-h-20 min-w-[17rem] items-center justify-center border-2 border-white/85 px-9 py-5 text-center font-serif text-sm font-semibold uppercase tracking-[0.26em] text-white transition-[background-color,color,transform] duration-500 hover:scale-[1.02] hover:bg-white hover:text-ink md:min-h-24 md:min-w-[20rem] md:text-base"
          >
            Book your space
          </Link>
        </ScrollReveal>
      </div>
    </section>
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
