/**
 * MyBookingsPage — 我的預約列表
 *
 * 路徑：/my-bookings（需登入）
 *
 * 顯示：BookingStatusBadge + PaymentStatusBadge、時間、金額、CTA 至詳細頁。
 * 空狀態：導去看空間介紹。
 */
import { Link } from 'react-router'
import { Spinner, type Booking } from '@studio/shared'
import { useMyBookings } from '../hooks/useMyBookings'
import { useStudios } from '../hooks/useStudios'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { BookingStatusBadge } from '../components/Booking/BookingStatusBadge'
import { PaymentStatusBadge } from '../components/Booking/PaymentStatusBadge'
import { formatMinute } from '../utils/time'

export function MyBookingsPage() {
  const { data, isLoading } = useMyBookings()
  const { data: studios } = useStudios()
  const studioMap = new Map(studios?.items.map((s) => [s.id, s.name]))

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Account"
        title="我的預約"
        subtitle="所有預約皆會顯示於此，包含待付款、已確認與完成的紀錄。"
      />

      <div className="flex justify-end">
        <Link to="/account" className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink">
          編輯會員資料
        </Link>
      </div>

      {isLoading && <div className="py-16 text-center"><Spinner /></div>}

      {!isLoading && (!data || data.items.length === 0) && (
        <EmptyState
          title="還沒有預約"
          description="來看看空間，找一個你喜歡的角落。"
          action={
            <Link
              to="/studios"
              className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover"
            >
              看看空間
            </Link>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-4">
          {data.items.map((b) => (
            <BookingRow key={b.id} booking={b} studioName={studioMap.get(b.studioId)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function BookingRow({ booking: b, studioName }: { booking: Booking; studioName?: string }) {
  const s = new Date(b.startAt)
  const e = new Date(b.endAt)
  const dateStr = `${s.getFullYear()} / ${String(s.getMonth() + 1).padStart(2, '0')} / ${String(s.getDate()).padStart(2, '0')}`
  const timeStr = `${formatMinute(s.getHours() * 60 + s.getMinutes())}–${formatMinute(e.getHours() * 60 + e.getMinutes())}`
  return (
    <li>
      <Link
        to={`/bookings/${b.id}`}
        className="block rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-sunken/40"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="font-serif text-lg text-ink">{studioName ?? `攝影棚 #${b.studioId}`}</h3>
              <BookingStatusBadge booking={b} />
              <PaymentStatusBadge status={b.paymentStatus} />
            </div>
            <p className="mt-1 text-sm text-ink-2">
              {dateStr}　{timeStr}　·　{b.totalHours} 小時
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-xl text-ink">NT$ {b.totalPrice.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-ink-3">{b.bookingNumber}</p>
          </div>
        </div>
      </Link>
    </li>
  )
}
