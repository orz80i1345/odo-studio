/**
 * BookingStatusBadge — 對應 THEME.md 的預約狀態色。
 * 「pending + unpaid/failed」顯示為「待付款」以呼應本輪需求。
 */
import { isPendingPayment, type Booking, type BookingStatus } from '@studio/shared'

const label: Record<BookingStatus, string> = {
  pending: '待確認',
  confirmed: '已確認',
  checked_in: '已入場',
  completed: '完成',
  cancelled: '已取消',
  no_show: '未到',
}

const cls: Record<BookingStatus, string> = {
  pending: 'bg-warning-subtle text-warning-subtle-ink',
  confirmed: 'bg-info-subtle text-info-subtle-ink',
  checked_in: 'bg-brand-subtle text-brand-subtle-ink',
  completed: 'bg-success-subtle text-success-subtle-ink',
  cancelled: 'bg-danger-subtle text-danger-subtle-ink',
  no_show: 'bg-neutral-subtle text-neutral-subtle-ink',
}

export function BookingStatusBadge({ booking }: { booking: Pick<Booking, 'status' | 'paymentStatus'> }) {
  const pendingPay = isPendingPayment(booking)
  const text = pendingPay ? '待付款' : label[booking.status]
  const style = pendingPay ? 'bg-warning-subtle text-warning-subtle-ink border border-warning' : cls[booking.status]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style}`}>
      {text}
    </span>
  )
}
