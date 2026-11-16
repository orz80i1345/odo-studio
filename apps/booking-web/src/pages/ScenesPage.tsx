import { useEffect, useRef } from 'react'
import { Spinner } from '@studio/shared'
import { Link } from 'react-router'
import type { Scene } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { SmartImage } from '../components/ui/SmartImage'
import { ScrollReveal } from '../components/ui/ScrollReveal'
import { useScenes } from '../hooks/useScenes'

const WHEEL_COPY_COUNT = 5
const WHEEL_CENTER_COPY = Math.floor(WHEEL_COPY_COUNT / 2)

export function ScenesPage() {
  const { data, isLoading } = useScenes()
  const carouselRef = useRef<HTMLDivElement>(null)
  const scenes = data?.items ?? []
  const wheelScenes = Array.from({ length: WHEEL_COPY_COUNT }, (_, copyIndex) => copyIndex).flatMap((copyIndex) =>
    scenes.map((scene, index) => ({ scene, index, copyIndex })),
  )

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel || scenes.length === 0) return

    let animationFrame: number | undefined
    let scrollIdleTimer: number | undefined
    let initialized = false
    let repositioning = false

    const centerScrollTop = (item: HTMLElement) => {
      const carouselRect = carousel.getBoundingClientRect()
      const layoutItem = item.parentElement ?? item
      const itemRect = layoutItem.getBoundingClientRect()
      const itemTop = itemRect.top - carouselRect.top + carousel.scrollTop
      return itemTop + itemRect.height / 2 - carousel.clientHeight / 2
    }

    const updateWheel = () => {
      animationFrame = undefined
      const items = carousel.querySelectorAll<HTMLElement>('[data-scene-wheel-item]')
      if (window.innerWidth >= 768) {
        items.forEach((item) => {
          item.style.transform = ''
          item.style.opacity = ''
          item.style.zIndex = ''
        })
        return
      }

      const carouselRect = carousel.getBoundingClientRect()
      const viewportCenter = carouselRect.top + carousel.clientHeight / 2
      const maxDistance = carousel.clientHeight * 0.62

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect()
        const itemCenter = itemRect.top + itemRect.height / 2
        const signedDistance = itemCenter - viewportCenter
        const distance = Math.abs(signedDistance)
        const proximity = 1 - Math.min(1, distance / maxDistance)
        const scale = 0.7 + proximity * 0.3
        const depth = -230 * (1 - proximity)
        const rotation = Math.max(-34, Math.min(34, (signedDistance / maxDistance) * -34))
        item.style.transform = `translate3d(0, 0, ${depth}px) rotateX(${rotation}deg) scale(${scale})`
        item.style.opacity = String(0.36 + proximity * 0.64)
        item.style.zIndex = String(Math.round(proximity * 100))
      })
    }

    const requestUpdate = () => {
      if (animationFrame !== undefined) return
      animationFrame = window.requestAnimationFrame(updateWheel)
    }

    const recenterWheel = () => {
      if (!initialized || repositioning || window.innerWidth >= 768) return

      const items = Array.from(carousel.querySelectorAll<HTMLElement>('[data-scene-wheel-item]'))
      const carouselRect = carousel.getBoundingClientRect()
      const viewportCenter = carouselRect.top + carousel.clientHeight / 2
      const currentItem = items.reduce<HTMLElement | null>((closest, item) => {
        const rect = item.getBoundingClientRect()
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter)
        if (!closest) return item
        const closestRect = closest.getBoundingClientRect()
        const closestDistance = Math.abs(closestRect.top + closestRect.height / 2 - viewportCenter)
        return distance < closestDistance ? item : closest
      }, null)

      if (!currentItem) return
      const currentCopy = Number(currentItem.dataset.wheelCopy)
      const currentIndex = currentItem.dataset.wheelIndex
      if (currentCopy === WHEEL_CENTER_COPY || currentIndex === undefined) return

      const targetItem = carousel.querySelector<HTMLElement>(
        `[data-wheel-copy="${WHEEL_CENTER_COPY}"][data-wheel-index="${currentIndex}"]`,
      )
      if (!targetItem) return

      const offset = centerScrollTop(targetItem) - centerScrollTop(currentItem)
      if (Math.abs(offset) < 1) return

      repositioning = true
      items.forEach((item) => {
        item.style.transition = 'none'
      })
      carousel.style.scrollSnapType = 'none'
      carousel.scrollTop += offset
      updateWheel()

      window.requestAnimationFrame(() => {
        items.forEach((item) => {
          item.style.transition = ''
        })
        carousel.style.scrollSnapType = ''
        repositioning = false
      })
    }

    const handleScroll = () => {
      requestUpdate()
      if (repositioning) return
      if (scrollIdleTimer !== undefined) window.clearTimeout(scrollIdleTimer)
      scrollIdleTimer = window.setTimeout(recenterWheel, 140)
    }

    const handleScrollEnd = () => {
      if (scrollIdleTimer !== undefined) window.clearTimeout(scrollIdleTimer)
      scrollIdleTimer = undefined
      recenterWheel()
    }

    const initializeWheel = () => {
      if (window.innerWidth < 768) {
        const middleFirst = carousel.querySelector<HTMLElement>(
          `[data-wheel-copy="${WHEEL_CENTER_COPY}"][data-wheel-index="0"]`,
        )
        if (middleFirst) carousel.scrollTop = centerScrollTop(middleFirst)
      }
      initialized = true
      requestUpdate()
    }

    carousel.addEventListener('scroll', handleScroll, { passive: true })
    carousel.addEventListener('scrollend', handleScrollEnd)
    window.addEventListener('resize', requestUpdate)
    const initializeFrame = window.requestAnimationFrame(initializeWheel)

    return () => {
      carousel.removeEventListener('scroll', handleScroll)
      carousel.removeEventListener('scrollend', handleScrollEnd)
      window.removeEventListener('resize', requestUpdate)
      window.cancelAnimationFrame(initializeFrame)
      if (scrollIdleTimer !== undefined) window.clearTimeout(scrollIdleTimer)
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
    }
  }, [scenes.length])

  return (
    <div className="md:space-y-24">
      <div className="hidden md:block">
        <PageHeader
          eyebrow="01 / Spaces"
          title="空間介紹"
          subtitle="每個空間保留不同的光線、材質與比例。預約時可以選擇單一空間，或選擇包場保留整個場地。"
        />
      </div>
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div
        ref={carouselRef}
        aria-label="空間滾輪選單"
        className="scene-wheel -mx-5 flex h-[76svh] snap-y snap-mandatory flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-[13svh] [perspective:950px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:block md:h-auto md:space-y-28 md:overflow-visible md:px-0 md:py-0 md:[perspective:none]"
      >
        {wheelScenes.map(({ scene, index, copyIndex }) => (
          <SceneFeature
            key={`${copyIndex}-${scene.id}`}
            scene={scene}
            index={index}
            copyIndex={copyIndex}
          />
        ))}
      </div>
    </div>
  )
}

function SceneFeature({ scene, index, copyIndex }: { scene: Scene; index: number; copyIndex: number }) {
  const reversed = index % 2 === 1
  const duplicateDesktopClass = copyIndex === WHEEL_CENTER_COPY ? '' : 'md:hidden'
  const tabIndex = copyIndex === WHEEL_CENTER_COPY ? undefined : -1
  return (
    <ScrollReveal
      className={`h-[50svh] min-h-[24rem] max-h-[32rem] shrink-0 snap-center md:h-auto md:min-h-0 md:max-h-none md:snap-none ${duplicateDesktopClass}`}
      distance={48}
    >
      <article
        data-scene-wheel-item
        data-wheel-copy={copyIndex}
        data-wheel-index={index}
        aria-hidden={copyIndex === WHEEL_CENTER_COPY ? undefined : true}
        className="relative grid h-full origin-center grid-rows-[minmax(0,1fr)_auto] overflow-hidden border border-line bg-surface shadow-card transition-[opacity,transform] duration-150 ease-out will-change-transform md:h-auto md:grid-cols-[1.05fr_0.95fr] md:grid-rows-none md:items-center md:gap-14 md:overflow-visible md:border-x-0 md:border-b-0 md:border-t md:bg-transparent md:pt-10 md:shadow-none md:transition-none md:will-change-auto"
      >
        <div className={reversed ? 'md:order-2' : undefined}>
          <Link to={`/spaces/${scene.id}`} tabIndex={tabIndex} aria-label={`查看更多 ${scene.name} 照片`} className="group block h-full">
            <div
              className="relative h-full min-h-0 overflow-hidden bg-sunken md:aspect-[3/4] md:h-auto"
            >
              {scene.coverUrl && (
                <SmartImage
                  src={scene.coverUrl}
                  alt={scene.name}
                  priority={copyIndex === WHEEL_CENTER_COPY && index < 2}
                  className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.025]"
                />
              )}
            </div>
          </Link>
        </div>
        <div className="max-w-md p-4 md:p-0">
          <p className="text-[10px] uppercase tracking-[0.32em] text-ink-3">
            Space {String(index + 1).padStart(2, '0')}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-medium leading-none text-ink md:mt-5 md:text-6xl md:leading-[0.98]">{scene.name}</h2>
          {scene.description && (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink-2 md:mt-6 md:line-clamp-none md:text-sm md:leading-8">{scene.description}</p>
          )}
          {scene.tags.length > 0 && (
            <div className="mt-7 hidden flex-wrap gap-x-4 gap-y-2 md:flex">
              {scene.tags.map((tag) => (
                <span key={tag} className="border-b border-line text-[11px] uppercase tracking-[0.18em] text-ink-3">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-col items-start gap-2 md:mt-9 md:gap-4">
            <Link
              to={`/book/${scene.studioId}?scenes=${scene.id}`}
              tabIndex={tabIndex}
              className="inline-flex border-b border-line-strong pb-1 text-xs uppercase tracking-[0.22em] text-ink-2 transition-colors duration-500 hover:border-ink hover:text-ink"
            >
              Booking →
            </Link>
            <Link
              to={`/spaces/${scene.id}`}
              tabIndex={tabIndex}
              className="inline-flex border-b border-line-strong pb-1 text-xs uppercase tracking-[0.22em] text-ink-2 transition-colors duration-500 hover:border-ink hover:text-ink"
            >
              More →
            </Link>
          </div>
        </div>
      </article>
    </ScrollReveal>
  )
}
