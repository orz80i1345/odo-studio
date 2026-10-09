import type { ApiClient } from '../client'
import type { Booking, BookingPaymentProof, ID, Payment } from '../../types'
import { filter, toScaffoldList, unwrapItem, type ScaffoldItemResponse, type ScaffoldListResponse } from './scaffold'

interface RawPayment {
  id: ID
  booking_id: ID
  payment_number: string
  payment_method: string
  payment_type: Payment['paymentType']
  amount: number
  currency?: string
  status: Payment['status']
  payer_name?: string
  /** 部署 API 目前的欄位名稱（doc.json）；保留正確拼字以相容後續修正。 */
  payer_las4?: string
  payer_last4?: string
  transferred_at?: string
  verified_at?: string
  metadata?: unknown
  created_at?: string
  updated_at?: string
}

export async function listBookingPayments(api: ApiClient, bookingId: ID) {
  const res = await api.get<ScaffoldListResponse<RawPayment>>('/public/payments', {
    pageSize: 100,
    filter: filter('booking_id', 'eq', bookingId),
    sort: '-created_at',
  })
  return toScaffoldList(res, toPayment).items
}

export async function createPendingPayment(api: ApiClient, booking: Booking) {
  const amount = booking.depositAmount > 0 ? booking.depositAmount : booking.totalPrice
  const paymentType: Payment['paymentType'] = amount < booking.totalPrice ? 'deposit' : 'full'
  const res = await api.post<ScaffoldItemResponse<RawPayment>>('/payments', {
    booking_id: booking.id,
    payment_number: `PAY-${booking.bookingNumber}-01`,
    payment_method: 'bank_transfer',
    payment_type: paymentType,
    amount,
    currency: 'TWD',
    status: 'pending',
    metadata: '{}',
  })
  return toPayment(unwrapItem(res))
}

export async function submitBankTransferProof(api: ApiClient, booking: Booking, proof: BookingPaymentProof) {
  const payments = await listBookingPayments(api, booking.id)
  const payment = payments.find((item) => item.status === 'pending' || item.status === 'failed')
    ?? await createPendingPayment(api, booking)
  const transferredAt = proof.paidAt ? new Date(proof.paidAt).toISOString() : undefined
  const metadata = {
    ...payment.metadata,
    customerPaymentNote: proof.paymentNote?.trim(),
    submittedAt: new Date().toISOString(),
  }
  const res = await api.patch<ScaffoldItemResponse<RawPayment>>(`/payments/${payment.id}`, {
    // 部署 API 的 doc.json 目前使用 payer_las4（少一個 t）。
    payer_las4: proof.bankLast4?.trim(),
    payer_name: proof.payerName?.trim(),
    transferred_at: transferredAt,
    status: 'pending',
    metadata: JSON.stringify(metadata),
  })
  return toPayment(unwrapItem(res))
}

export async function cancelPendingPayments(api: ApiClient, bookingId: ID) {
  const payments = await listBookingPayments(api, bookingId)
  await Promise.all(payments
    .filter((payment) => payment.status === 'pending' || payment.status === 'failed')
    .map((payment) => api.patch(`/payments/${payment.id}`, { status: 'cancelled' })))
}

function toPayment(raw: RawPayment): Payment {
  return {
    id: raw.id,
    bookingId: raw.booking_id,
    paymentNumber: raw.payment_number,
    paymentMethod: raw.payment_method,
    paymentType: raw.payment_type,
    amount: Number(raw.amount ?? 0),
    currency: raw.currency ?? 'TWD',
    status: raw.status,
    payerName: raw.payer_name,
    payerLast4: raw.payer_las4 ?? raw.payer_last4,
    transferredAt: raw.transferred_at,
    verifiedAt: raw.verified_at,
    metadata: objectValue(raw.metadata),
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}
