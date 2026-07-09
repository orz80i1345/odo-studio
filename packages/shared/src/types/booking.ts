/**
 * booking.ts
 * 預約單型別，狀態機對應 schema 的 CHECK 約束。
 */
import type { ID, DateString, ISODateTime } from './common'

/** 預約主流程狀態 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show'

/** 預約付款狀態（bookings.payment_status，聚合層） */
export type BookingPaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid'
  | 'refund_pending'
  | 'refunded'
  | 'failed'

export type BookingSource = 'web' | 'phone' | 'walk_in' | 'admin'

export interface Booking {
  id: ID
  bookingNumber: string                     // ODE-20260703-0001
  studioId: ID
  customerAccountId?: ID
  customerName: string
  customerPhone: string
  customerEmail: string
  startAt: ISODateTime
  endAt: ISODateTime
  totalHours: number
  headcount?: number
  purpose?: string
  sceneIds: ID[]
  subtotal: number
  discountAmount: number
  discountCode?: string
  taxAmount: number
  totalPrice: number
  depositAmount: number
  status: BookingStatus
  paymentStatus: BookingPaymentStatus
  customerNote?: string
  confirmedAt?: DateString
  cancelledAt?: DateString
  cancellationReason?: string
  source: BookingSource
  createdAt: DateString
  updatedAt: DateString
}

/** 建立預約表單 → API */
export interface CreateBookingInput {
  studioId: ID
  startAt: ISODateTime
  endAt: ISODateTime
  customerName: string
  customerPhone: string
  customerEmail: string
  sceneIds?: ID[]
  headcount?: number
  purpose?: string
  customerNote?: string
}

/** 「待付款」複合狀態的顯示判斷 */
export function isPendingPayment(b: Pick<Booking, 'status' | 'paymentStatus'>): boolean {
  return b.status === 'pending' && (b.paymentStatus === 'unpaid' || b.paymentStatus === 'failed')
}
