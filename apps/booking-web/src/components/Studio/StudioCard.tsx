import { Link } from 'react-router'
import type { Studio } from '@studio/shared'
import { SmartImage } from '../ui/SmartImage'

export function StudioCard({ studio, priority = false }: { studio: Studio; priority?: boolean }) {
  return (
    <Link
      to={`/studios/${studio.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sunken">
        {studio.coverUrl && (
          <SmartImage
            src={studio.coverUrl}
            alt={studio.name}
            priority={priority}
            className="size-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.025]"
          />
        )}
      </div>
      <div className="border-b border-line py-5">
        <h3 className="font-serif text-3xl leading-tight text-ink">{studio.name}</h3>
        <p className="mt-4 line-clamp-2 max-w-xl text-sm leading-7 text-ink-2">{studio.description}</p>
        <div className="mt-6 flex items-baseline justify-between gap-4 text-[11px] uppercase tracking-[0.16em] text-ink-3">
          <span>{studio.areaPing} 坪 · {studio.floor}</span>
          <span className="text-ink-2">起 NT$ {studio.defaultHourlyPrice.toLocaleString()} / 時</span>
        </div>
      </div>
    </Link>
  )
}
