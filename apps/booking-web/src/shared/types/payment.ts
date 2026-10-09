import type { DateString, ID } from './common'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type PaymentType = 'deposit' | 'full' | 'balance'

export interface Payment {
  id: ID
  bookingId: ID
  paymentNumber: string
  paymentMethod: string
  paymentType: PaymentType
  amount: number
  currency: string
  status: PaymentStatus
  payerName?: string
  payerLast4?: string
  transferredAt?: DateString
  verifiedAt?: DateString
  metadata: Record<string, unknown>
  createdAt: DateString
  updatedAt: DateString
}
