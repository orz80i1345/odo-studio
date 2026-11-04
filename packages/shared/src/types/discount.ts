import type { ID } from './common'

export type DiscountType = 'hourly_fixed' | 'fixed_amount' | 'percent'

export interface DiscountCode {
  id: ID
  code: string
  name?: string
  discountType: DiscountType
  discountAmount: number
  isActive: boolean
  commissionPartnerName?: string
  commissionBaseValue?: number
  metadata: Record<string, unknown>
}

export interface AppliedDiscount {
  code: string
  name?: string
  discountType: DiscountType
  discountAmount: number
  discountTotal: number
  totalPrice: number
  commissionPartnerName?: string
  commissionBaseValue?: number
  commissionAmount?: number
}
