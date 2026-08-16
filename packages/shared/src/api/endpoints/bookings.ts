/**
 * endpoints/bookings.ts
 * 預約單。前台會員只能看自己的預約；後台可看全部。
 */
import type { ApiClient } from '../client'
import type { Booking, BookingPaymentProof, CreateBookingInput, ID, Paginated } from '../../types'
import {
  filter,
  toBooking,
  toBookingCreate,
  toScaffoldList,
  toTimeSlot,
  unwrapItem,
  type RawBookingSceneTimeSlot,
  type RawBooking,
  type RawTimeSlot,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'
import { validateHourlyDiscountCode } from './discountCodes'
import { getDepositRatio } from './systemSettings'
import { listScenePrices, listStudioPrices } from './pricing'

/** 建立預約（登入會員） */
export async function createBooking(api: ApiClient, input: CreateBookingInput) {
  const bookingMode = input.bookingMode ?? 'scenes'
  const slots = await getBookingSlots(api, input)
  if (slots.length === 0 || slots.some((slot) => slot.status !== 'available')) {
    throw new Error('此時段已被預約或暫時不可預約，請重新選擇時段。')
  }
  const sceneIds = input.sceneIds ?? []
  if (sceneIds.length === 0) throw new Error('請選擇至少一個佈景。')
  await assertSceneSlotsAvailable(api, sceneIds, slots.map((slot) => slot.id))
  const totals = await calculateBookingTotals(api, input, slots)
  const discount = input.discount?.code
    ? await validateHourlyDiscountCode(api, {
      code: input.discount.code,
      subtotal: totals.subtotal,
      totalHours: calculateTotalHours(input.startAt, input.endAt),
    })
    : undefined
  const depositRatio = await getDepositRatio(api)
  const finalTotals = applyDiscountToTotals(totals, discount?.discountTotal ?? 0, depositRatio)
  const res = await api.post<ScaffoldItemResponse<RawBooking>>('/public/bookings', toBookingCreate({ ...input, bookingMode, discount }, finalTotals))
  const booking = toBooking(unwrapItem(res))
  try {
    await createBookingSceneTimeSlots(api, booking, sceneIds, slots.map((slot) => slot.id))
    if (booking.bookingMode === 'buyout') await syncBookingTimeSlots(api, booking, 'booked')
  } catch (error) {
    await deleteBookingSceneTimeSlots(api, booking.id).catch(() => {})
    await api.patch(`/public/bookings/${booking.id}`, {
      status: 'cancelled',
      cancellation_reason: 'scene_slot_conflict',
      cancelled_at: new Date().toISOString(),
    }).catch(() => {})
    throw error
  }
  await syncDailyAvailability(api, booking.studioId, localDateFromIso(booking.startAt)).catch(() => {})
  return booking
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
  const booking = toBooking(unwrapItem(res))
  await deleteBookingSceneTimeSlots(api, booking.id)
  await syncBookingTimeSlots(api, booking, 'available')
  await syncDailyAvailability(api, booking.studioId, localDateFromIso(booking.startAt)).catch(() => {})
  return booking
}

export async function submitPaymentProof(api: ApiClient, booking: Booking, proof: BookingPaymentProof) {
  const metadata = {
    ...booking.metadata,
    paymentProof: {
      ...proof,
      bankLast5: proof.bankLast5?.trim(),
      payerName: proof.payerName?.trim(),
      paymentNote: proof.paymentNote?.trim(),
      submittedAt: new Date().toISOString(),
    },
  }
  const res = await api.patch<ScaffoldItemResponse<RawBooking>>(`/public/bookings/${booking.id}`, {
    metadata: JSON.stringify(metadata),
  })
  return toBooking(unwrapItem(res))
}

async function getBookingSlots(api: ApiClient, input: Pick<CreateBookingInput, 'studioId' | 'startAt' | 'endAt'>) {
  const { slotDate, startMinute, endMinute } = bookingRangeMinutes(input.startAt, input.endAt)
  const slotsRes = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 100,
    filter: [
      filter('studio_id', 'eq', input.studioId),
      filter('slot_date', 'eq', toApiDateTime(slotDate)),
      filter('start_minute', 'gte', startMinute),
      filter('end_minute', 'lte', endMinute),
    ],
  })
  return toScaffoldList(slotsRes, toTimeSlot).items
}

async function calculateBookingTotals(api: ApiClient, input: CreateBookingInput, slots: ReturnType<typeof toTimeSlot>[]) {
  const hours = calculateTotalHours(input.startAt, input.endAt)
  const sceneIds = input.sceneIds ?? []
  const fallbackHourlyPrice = slots.length > 0
    ? slots.reduce((sum, slot) => sum + Number(slot.hourlyPrice ?? 0), 0) / slots.length
    : 0
  const hourlyPrice = input.bookingMode === 'buyout'
    ? await getBuyoutHourlyPrice(api, input.studioId, fallbackHourlyPrice)
    : await getScenesHourlyPrice(api, sceneIds, fallbackHourlyPrice)
  const subtotal = hourlyPrice * hours
  const totalPrice = Math.round(subtotal)
  return applyDiscountToTotals({ subtotal: totalPrice }, 0)
}

async function getScenesHourlyPrice(api: ApiClient, sceneIds: ID[], fallbackHourlyPrice: number) {
  const prices = await listScenePrices(api, { sceneIds })
  const priceBySceneId = new Map(prices.map((price) => [price.sceneId, price.hourlyPrice]))
  return sceneIds.reduce((sum, sceneId) => sum + (priceBySceneId.get(sceneId) ?? fallbackHourlyPrice), 0)
}

async function getBuyoutHourlyPrice(api: ApiClient, studioId: ID, fallbackHourlyPrice: number) {
  const prices = await listStudioPrices(api, { studioIds: [studioId], priceType: 'buyout' })
  return prices[0]?.hourlyPrice ?? fallbackHourlyPrice
}

function applyDiscountToTotals(totals: { subtotal: number }, discountTotal: number, depositRatio = 1) {
  const discountAmount = Math.min(Math.max(0, Math.round(discountTotal)), totals.subtotal)
  const totalPrice = totals.subtotal - discountAmount
  return {
    subtotal: totals.subtotal,
    discountAmount,
    totalPrice,
    depositAmount: Math.round(totalPrice * depositRatio),
  }
}

function calculateTotalHours(startAt: string, endAt: string) {
  return Math.round(((+new Date(endAt) - +new Date(startAt)) / 3_600_000) * 100) / 100
}

async function syncBookingTimeSlots(api: ApiClient, booking: Booking, status: 'booked' | 'available') {
  const { slotDate, startMinute, endMinute } = bookingRangeMinutes(booking.startAt, booking.endAt)
  const slotsRes = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 100,
    filter: [
      filter('studio_id', 'eq', booking.studioId),
      filter('slot_date', 'eq', toApiDateTime(slotDate)),
    ],
  })
  const slots = toScaffoldList(slotsRes, toTimeSlot).items
  const overlappingSlots = slots.filter((slot) => slot.startMinute < endMinute && slot.endMinute > startMinute)
  const exactBookingSlots = overlappingSlots.filter((slot) => slot.bookingId === booking.id)
  const targetSlots = status === 'available' ? exactBookingSlots : overlappingSlots
  await Promise.all(targetSlots
    .map((slot) => api.patch(`/public/time_slots/${slot.id}`, {
      status,
      booking_id: status === 'booked' ? booking.id : null,
      metadata: '{}',
    })))
}

async function assertSceneSlotsAvailable(api: ApiClient, sceneIds: ID[], timeSlotIds: ID[]) {
  if (sceneIds.length === 0 || timeSlotIds.length === 0) return
  for (const sceneId of sceneIds) {
    for (const timeSlotId of timeSlotIds) {
      const existing = await api.get<ScaffoldListResponse<RawBookingSceneTimeSlot>>('/public/booking_scene_time_slots', {
        pageSize: 1,
        filter: [
          filter('scene_id', 'eq', sceneId),
          filter('time_slot_id', 'eq', timeSlotId),
        ],
      })
      if (toScaffoldList(existing, (item) => item).items.length > 0) {
        throw new Error('所選佈景在此時段已被預約，請重新選擇佈景或時段。')
      }
    }
  }
}

async function createBookingSceneTimeSlots(api: ApiClient, booking: Booking, sceneIds: ID[], timeSlotIds: ID[]) {
  const payload = sceneIds.flatMap((sceneId) =>
    timeSlotIds.map((timeSlotId) => ({
      booking_id: booking.id,
      scene_id: sceneId,
      time_slot_id: timeSlotId,
      status: 'active',
    })))
  if (payload.length === 0) return
  await api.post('/public/booking_scene_time_slots/batch', payload)
}

async function deleteBookingSceneTimeSlots(api: ApiClient, bookingId: ID) {
  const existing = await api.get<ScaffoldListResponse<RawBookingSceneTimeSlot>>('/public/booking_scene_time_slots', {
    pageSize: 100,
    filter: filter('booking_id', 'eq', bookingId),
  })
  await Promise.all(toScaffoldList(existing, (item) => item).items.map((item) => api.delete(`/public/booking_scene_time_slots/${item.id}`)))
}

async function syncDailyAvailability(api: ApiClient, studioId: ID, date: string) {
  const slotsRes = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 100,
    filter: [
      filter('studio_id', 'eq', studioId),
      filter('slot_date', 'eq', toApiDateTime(date)),
    ],
  })
  const slots = toScaffoldList(slotsRes, toTimeSlot).items
  const counts = {
    available: 0,
    held: 0,
    booked: 0,
    blocked: 0,
    maintenance: 0,
    holiday: 0,
  }
  for (const slot of slots) {
    if (slot.status in counts) counts[slot.status as keyof typeof counts] += 1
  }
  const prices = slots.map((slot) => slot.hourlyPrice).filter((price): price is number => price !== undefined)
  const totalCount = slots.length
  const unavailableWithoutBookings = counts.blocked + counts.maintenance + counts.holiday
  const payload = {
    studio_id: studioId,
    availability_date: toApiDateTime(date),
    total_count: totalCount,
    available_count: counts.available,
    held_count: counts.held,
    booked_count: counts.booked,
    blocked_count: counts.blocked,
    maintenance_count: counts.maintenance,
    holiday_count: counts.holiday,
    is_closed: totalCount === 0 || (unavailableWithoutBookings === totalCount && counts.booked === 0 && counts.held === 0),
    open_start_minute: totalCount > 0 ? Math.min(...slots.map((slot) => slot.startMinute)) : undefined,
    open_end_minute: totalCount > 0 ? Math.max(...slots.map((slot) => slot.endMinute)) : undefined,
    min_hourly_price: prices.length > 0 ? Math.min(...prices) : undefined,
    max_hourly_price: prices.length > 0 ? Math.max(...prices) : undefined,
    metadata: '{}',
  }
  const existing = await api.get<ScaffoldListResponse<{ id: ID }>>('/public/studio_daily_availability', {
    pageSize: 1,
    filter: [
      filter('studio_id', 'eq', studioId),
      filter('availability_date', 'eq', toApiDateTime(date)),
    ],
  })
  const item = toScaffoldList(existing, (value) => value).items[0]
  if (item) await api.patch(`/public/studio_daily_availability/${item.id}`, payload)
  else await api.post('/public/studio_daily_availability', payload)
}

function localDateFromIso(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function bookingRangeMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const slotDate = localDateFromIso(startAt)
  const endDate = localDateFromIso(endAt)
  const startMinute = start.getHours() * 60 + start.getMinutes()
  const rawEndMinute = end.getHours() * 60 + end.getMinutes()
  const endMinute = endDate > slotDate || rawEndMinute <= startMinute ? 1440 : rawEndMinute
  return { slotDate, startMinute, endMinute }
}

function toApiDateTime(date: string): string {
  return `${date}T00:00:00Z`
}
