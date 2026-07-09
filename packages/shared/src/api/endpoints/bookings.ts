/**
 * endpoints/bookings.ts
 * 預約單。前台會員只能看自己的預約；後台可看全部。
 */
import type { ApiClient } from '../client'
import type { Booking, CreateBookingInput, ID, Paginated } from '../../types'
import {
  filter,
  toBooking,
  toBookingCreate,
  toScaffoldList,
  toTimeSlot,
  unwrapItem,
  type RawBooking,
  type RawTimeSlot,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

/** 建立預約（登入會員） */
export async function createBooking(api: ApiClient, input: CreateBookingInput) {
  const totals = await calculateBookingTotals(api, input)
  const res = await api.post<ScaffoldItemResponse<RawBooking>>('/public/bookings', toBookingCreate(input, totals))
  return toBooking(unwrapItem(res))
}

/** 我的預約列表（前台會員；後端由 token 判斷） */
export async function listMyBookings(
  api: ApiClient,
  params?: { page?: number; pageSize?: number; status?: string; customerEmail?: string },
) {
  const filters: string[] = []
  if (params?.status) filters.push(filter('status', 'eq', params.status))
  if (params?.customerEmail) filters.push(filter('customer_email', 'eq', params.customerEmail))
  const res = await api.get<ScaffoldListResponse<RawBooking>>('/public/bookings', {
    page: params?.page,
    pageSize: params?.pageSize ?? 50,
    filter: filters,
    sort: '-created_at',
  })
  return toScaffoldList(res, toBooking) satisfies Paginated<Booking>
}

/** 單一預約詳細 */
export async function getBooking(api: ApiClient, bookingId: ID) {
  const res = await api.get<ScaffoldItemResponse<RawBooking>>(`/public/bookings/${bookingId}`)
  return toBooking(unwrapItem(res))
}

/** 取消預約（前台會員） */
export async function cancelBooking(api: ApiClient, bookingId: ID, reason?: string) {
  const res = await api.patch<ScaffoldItemResponse<RawBooking>>(`/public/bookings/${bookingId}`, {
    status: 'cancelled',
    cancellation_reason: reason,
    cancelled_at: new Date().toISOString(),
  })
  return toBooking(unwrapItem(res))
}

async function calculateBookingTotals(api: ApiClient, input: CreateBookingInput) {
  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  const startMinute = start.getHours() * 60 + start.getMinutes()
  const endMinute = end.getHours() * 60 + end.getMinutes()
  const slotDate = input.startAt.slice(0, 10)
  const slotsRes = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 200,
    filter: [
      filter('studio_id', 'eq', input.studioId),
      filter('slot_date', 'eq', slotDate),
      filter('start_minute', 'gte', startMinute),
      filter('end_minute', 'lte', endMinute),
    ],
  })
  const slots = toScaffoldList(slotsRes, toTimeSlot).items
  const subtotal = slots.length > 0
    ? slots.reduce((sum, slot) => sum + Number(slot.hourlyPrice ?? 0), 0)
    : 0
  const totalPrice = Math.round(subtotal)
  return {
    subtotal: totalPrice,
    totalPrice,
    depositAmount: Math.round(totalPrice * 0.3),
  }
}
