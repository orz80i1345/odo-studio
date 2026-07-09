import { Link } from 'react-router'
import type { Studio } from '@studio/shared'

export function StudioCard({ studio }: { studio: Studio }) {
  return (
    <Link
      to={`/studios/${studio.slug}`}
      className="group block overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-raised"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-sunken">
        {studio.coverUrl && (
          <img
            src={studio.coverUrl}
            alt={studio.name}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="p-5">
        <h3 className="font-serif text-xl text-ink">{studio.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-2">{studio.description}</p>
        <div className="mt-4 flex items-baseline justify-between text-xs text-ink-3">
          <span>{studio.areaPing} 坪 · {studio.floor}</span>
          <span className="text-ink-2">起 NT$ {studio.defaultHourlyPrice.toLocaleString()} / 時</span>
        </div>
      </div>
    </Link>
  )
}
