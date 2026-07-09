/**
 * BookingSummary — 側欄式訂單摘要，於確認頁 + 完成頁複用。
 */
import type { Studio } from '@studio/shared'
import { formatMinute } from '../../utils/time'

interface Props {
  studio: Pick<Studio, 'name' | 'floor' | 'address'>
  startAt: string
  endAt: string
  totalPrice?: number
  sceneNames?: string[]
  bookingNumber?: string
  extraRows?: { label: string; value: string }[]
}

export function BookingSummary({ studio, startAt, endAt, totalPrice, sceneNames, bookingNumber, extraRows }: Props) {
  const s = new Date(startAt)
  const e = new Date(endAt)
  const hours = Math.round(((+e - +s) / 3_600_000) * 100) / 100
  const dateStr = `${s.getFullYear()} / ${String(s.getMonth() + 1).padStart(2, '0')} / ${String(s.getDate()).padStart(2, '0')}（週${'日一二三四五六'[s.getDay()]}）`
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h3 className="font-serif text-lg text-ink">訂單摘要</h3>
      {bookingNumber && (
        <p className="mt-1 text-xs text-ink-3">訂單編號 {bookingNumber}</p>
      )}
      <dl className="mt-4 space-y-3 text-sm">
        <Row label="攝影棚" value={`${studio.name}${studio.floor ? `（${studio.floor}）` : ''}`} />
        {studio.address && <Row label="地址" value={studio.address} />}
        <Row label="日期" value={dateStr} />
        <Row label="時段" value={`${formatMinute(s.getHours() * 60 + s.getMinutes())}–${formatMinute(e.getHours() * 60 + e.getMinutes())}（${hours} 小時）`} />
        {sceneNames && sceneNames.length > 0 && (
          <Row label="佈景" value={sceneNames.join('、')} />
        )}
        {extraRows?.map((r) => <Row key={r.label} label={r.label} value={r.value} />)}
        {typeof totalPrice === 'number' && (
          <>
            <div className="border-t border-line pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2">合計</span>
                <span className="font-serif text-2xl text-ink">NT$ {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </dl>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 text-right text-ink">{value}</dd>
    </div>
  )
}
