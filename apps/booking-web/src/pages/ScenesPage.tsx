import { useEffect, useRef } from 'react'
import { Spinner } from '@studio/shared'
import { Link } from 'react-router'
import type { Scene } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { SmartImage } from '../components/ui/SmartImage'
import { ScrollReveal } from '../components/ui/ScrollReveal'
import { useScenes } from '../hooks/useScenes'

export function ScenesPage() {
  const { data, isLoading } = useScenes()
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    let animationFrame: number | undefined

    const updateScale = () => {
      animationFrame = undefined
      const images = carousel.querySelectorAll<HTMLElement>('[data-scene-image]')
      if (window.innerWidth >= 768) {
        images.forEach((image) => {
          image.style.transform = ''
          image.style.opacity = ''
        })
        return
      }

      const carouselRect = carousel.getBoundingClientRect()
      const viewportCenter = carouselRect.left + carousel.clientWidth / 2
      const maxDistance = carousel.clientWidth * 0.72

      images.forEach((image) => {
        const imageRect = image.getBoundingClientRect()
        const imageCenter = imageRect.left + imageRect.width / 2
        const distance = Math.abs(imageCenter - viewportCenter)
        const proximity = 1 - Math.min(1, distance / maxDistance)
        const scale = 0.8 + proximity * 0.2
        image.style.transform = `translateZ(0) scale(${scale})`
        image.style.opacity = String(0.72 + proximity * 0.28)
      })
    }

    const requestUpdate = () => {
      if (animationFrame !== undefined) return
      animationFrame = window.requestAnimationFrame(updateScale)
    }

    carousel.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    requestUpdate()

    return () => {
      carousel.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
    }
  }, [data?.items.length])

  return (
    <div className="space-y-16 md:space-y-24">
      <PageHeader
        eyebrow="01 / Spaces"
        title="空間介紹"
        subtitle="每個空間保留不同的光線、材質與比例。預約時可以選擇單一空間，或選擇包場保留整個場地。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div
        ref={carouselRef}
        className="-mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:block md:space-y-28 md:overflow-visible md:px-0 md:pb-0"
      >
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
    <ScrollReveal
      className="w-[82vw] max-w-[22rem] shrink-0 snap-center md:w-auto md:max-w-none md:snap-none"
      distance={48}
    >
      <article className="grid gap-8 border-t border-line pt-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-14">
        <div className={reversed ? 'md:order-2' : undefined}>
          <Link to={`/spaces/${scene.id}`} aria-label={`查看更多 ${scene.name} 照片`} className="group block">
            <div
              data-scene-image
              className="relative aspect-[4/5] origin-center overflow-hidden bg-sunken opacity-75 will-change-transform md:aspect-[3/4] md:opacity-100 md:will-change-auto"
            >
              {scene.coverUrl && (
                <SmartImage
                  src={scene.coverUrl}
                  alt={scene.name}
                  priority={index < 2}
                  className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.025]"
                />
              )}
            </div>
          </Link>
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
          <div className="mt-9 flex flex-col items-start gap-4">
            <Link
              to={`/book/${scene.studioId}?scenes=${scene.id}`}
              className="inline-flex border-b border-line-strong pb-1 text-xs uppercase tracking-[0.22em] text-ink-2 transition-colors duration-500 hover:border-ink hover:text-ink"
            >
              Booking →
            </Link>
            <Link
              to={`/spaces/${scene.id}`}
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
