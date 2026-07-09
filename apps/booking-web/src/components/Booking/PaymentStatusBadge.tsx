import type { BookingPaymentStatus } from '@studio/shared'

const label: Record<BookingPaymentStatus, string> = {
  unpaid: '未付款',
  deposit_paid: '已付訂金',
  paid: '已付清',
  refund_pending: '退款處理中',
  refunded: '已退款',
  failed: '付款失敗',
}

const cls: Record<BookingPaymentStatus, string> = {
  unpaid: 'bg-warning-subtle text-warning-subtle-ink',
  deposit_paid: 'bg-info-subtle text-info-subtle-ink',
  paid: 'bg-success-subtle text-success-subtle-ink',
  refund_pending: 'bg-warning-subtle text-warning-subtle-ink border border-warning',
  refunded: 'bg-neutral-subtle text-neutral-subtle-ink',
  failed: 'bg-danger-subtle text-danger-subtle-ink',
}

export function PaymentStatusBadge({ status }: { status: BookingPaymentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls[status]}`}>
      {label[status]}
    </span>
  )
}
