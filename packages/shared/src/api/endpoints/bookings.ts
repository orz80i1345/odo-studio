/**
 * endpoints/bookings.ts
 * 預約單。前台會員只能看自己的預約；後台可看全部。
 */
import type { ApiClient } from '../client'
import type { Booking, CreateBookingInput, ID, Paginated } from '../../types'

/** 建立預約（登入會員） */
export function createBooking(api: ApiClient, input: CreateBookingInput) {
  return api.post<Booking>('/bookings', input)
}

/** 我的預約列表（前台會員；後端由 token 判斷） */
export function listMyBookings(api: ApiClient, params?: { page?: number; pageSize?: number; status?: string }) {
  return api.get<Paginated<Booking>>('/my/bookings', params as Record<string, string | number | undefined>)
}

/** 單一預約詳細 */
export function getBooking(api: ApiClient, bookingId: ID) {
  return api.get<Booking>(`/bookings/${bookingId}`)
}

/** 取消預約（前台會員） */
export function cancelBooking(api: ApiClient, bookingId: ID, reason?: string) {
  return api.post<Booking>(`/bookings/${bookingId}/cancel`, { reason })
}
