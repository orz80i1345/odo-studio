import type { ApiClient } from '../client'
import type { AppliedDiscount, DiscountCode, DiscountType, ID, Paginated } from '../../types'
import { toScaffoldList, unwrapItem, type ScaffoldItemResponse, type ScaffoldListResponse } from './scaffold'

interface RawDiscountCode {
  id: ID
  code: string
  name?: string
  discount_type: DiscountType
  discount_amount: number
  is_active?: boolean
  metadata?: Record<string, unknown>
}

export interface DiscountCodeInput {
  code: string
  name?: string
  discountType: DiscountType
  discountAmount: number
  isActive?: boolean
  metadata?: Record<string, unknown>
}

export async function listDiscountCodes(api: ApiClient) {
  const res = await api.get<ScaffoldListResponse<RawDiscountCode>>('/public/discount_codes', {
    pageSize: 100,
    sort: 'code_asc',
  })
  return toScaffoldList(res, toDiscountCode) satisfies Paginated<DiscountCode>
}

export async function getDiscountCodeByCode(api: ApiClient, code: string) {
  const normalized = normalizeCode(code)
  const res = await api.get<ScaffoldItemResponse<RawDiscountCode>>(`/public/discount_codes/by_code/${encodeURIComponent(normalized)}`)
  return toDiscountCode(unwrapItem(res))
}

export async function createDiscountCode(api: ApiClient, input: DiscountCodeInput) {
  const res = await api.post<ScaffoldItemResponse<RawDiscountCode>>('/public/discount_codes', toDiscountCodePayload(input))
  return toDiscountCode(unwrapItem(res))
}

export async function updateDiscountCode(api: ApiClient, id: ID, input: DiscountCodeInput) {
  const res = await api.patch<ScaffoldItemResponse<RawDiscountCode>>(`/public/discount_codes/${id}`, toDiscountCodePayload(input))
  return toDiscountCode(unwrapItem(res))
}

export function deleteDiscountCode(api: ApiClient, id: ID) {
  return api.delete<void>(`/public/discount_codes/${id}`)
}

export async function validateHourlyDiscountCode(
  api: ApiClient,
  input: { code: string; subtotal: number; totalHours: number },
): Promise<AppliedDiscount> {
  const discount = await getDiscountCodeByCode(api, input.code)
  if (!discount.isActive) throw new Error('折扣碼未啟用')
  if (discount.discountType !== 'hourly_fixed') throw new Error('此折扣碼目前不適用於線上預約')

  const discountTotal = Math.min(
    Math.max(0, Math.round(discount.discountAmount * input.totalHours)),
    Math.max(0, Math.round(input.subtotal)),
  )

  return {
    code: discount.code,
    name: discount.name,
    discountType: discount.discountType,
    discountAmount: discount.discountAmount,
    discountTotal,
    totalPrice: Math.max(0, Math.round(input.subtotal) - discountTotal),
  }
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function toDiscountCode(raw: RawDiscountCode): DiscountCode {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    discountType: raw.discount_type,
    discountAmount: Number(raw.discount_amount ?? 0),
    isActive: raw.is_active ?? true,
    metadata: raw.metadata ?? {},
  }
}

function toDiscountCodePayload(input: DiscountCodeInput) {
  return {
    code: normalizeCode(input.code),
    name: input.name,
    discount_type: input.discountType,
    discount_amount: Math.max(0, Math.round(input.discountAmount)),
    is_active: input.isActive ?? true,
    metadata: input.metadata ?? {},
  }
}
