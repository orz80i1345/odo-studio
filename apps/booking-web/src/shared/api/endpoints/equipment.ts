import type { ApiClient } from '../client'
import type { BookingEquipmentItem, BookingEquipmentTimeSlot, EquipmentItem, ID, Paginated } from '../../types'
import {
  filter,
  toBookingEquipmentItem,
  toBookingEquipmentTimeSlot,
  toEquipmentItem,
  toScaffoldList,
  unwrapItem,
  type RawBookingEquipmentItem,
  type RawBookingEquipmentTimeSlot,
  type RawEquipmentItem,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

export interface EquipmentItemInput {
  name: string
  description?: string
  unitPrice: number
  imageUrl?: string
  isActive?: boolean
  displayOrder?: number
  metadata?: Record<string, unknown>
}

export async function listEquipmentItems(api: ApiClient, params?: { activeOnly?: boolean; pageSize?: number }) {
  const filters = params?.activeOnly ? [filter('is_active', 'eq', true)] : []
  const res = await api.get<ScaffoldListResponse<RawEquipmentItem>>('/public/equipment_items', {
    pageSize: params?.pageSize ?? 100,
    filter: filters,
    sort: 'display_order_asc',
  })
  return toScaffoldList(res, toEquipmentItem) satisfies Paginated<EquipmentItem>
}

export async function createEquipmentItem(api: ApiClient, input: EquipmentItemInput) {
  const res = await api.post<ScaffoldItemResponse<RawEquipmentItem>>('/public/equipment_items', equipmentPayload(input))
  return toEquipmentItem(unwrapItem(res))
}

export async function updateEquipmentItem(api: ApiClient, id: ID, input: EquipmentItemInput) {
  const res = await api.patch<ScaffoldItemResponse<RawEquipmentItem>>(`/public/equipment_items/${id}`, equipmentPayload(input))
  return toEquipmentItem(unwrapItem(res))
}

export async function deleteEquipmentItem(api: ApiClient, id: ID) {
  await api.delete(`/public/equipment_items/${id}`)
}

export async function listBookingEquipmentItems(api: ApiClient, bookingId: ID) {
  const res = await api.get<ScaffoldListResponse<RawBookingEquipmentItem>>('/public/booking_equipment_items', {
    pageSize: 100,
    filter: filter('booking_id', 'eq', bookingId),
  })
  return toScaffoldList(res, toBookingEquipmentItem).items satisfies BookingEquipmentItem[]
}

export async function listBookingEquipmentTimeSlots(api: ApiClient, params: { equipmentItemIds?: ID[]; timeSlotIds?: ID[]; bookingId?: ID }) {
  const filters: string[] = []
  if (params.bookingId) filters.push(filter('booking_id', 'eq', params.bookingId))
  if (params.equipmentItemIds && params.equipmentItemIds.length > 0) filters.push(filter('equipment_item_id', 'in', params.equipmentItemIds.join(',')))
  if (params.timeSlotIds && params.timeSlotIds.length > 0) filters.push(filter('time_slot_id', 'in', params.timeSlotIds.join(',')))
  const res = await api.get<ScaffoldListResponse<RawBookingEquipmentTimeSlot>>('/public/booking_equipment_time_slots', {
    pageSize: 500,
    filter: filters,
  })
  return toScaffoldList(res, toBookingEquipmentTimeSlot).items satisfies BookingEquipmentTimeSlot[]
}

export async function createBookingEquipment(api: ApiClient, params: { bookingId: ID; equipmentItems: EquipmentItem[]; timeSlotIds: ID[] }) {
  if (params.equipmentItems.length === 0) return
  const itemPayload = params.equipmentItems.map((item) => ({
    booking_id: params.bookingId,
    equipment_item_id: item.id,
    name: item.name,
    quantity: 1,
    unit_price: item.unitPrice,
    subtotal: item.unitPrice,
    metadata: '{}',
  }))
  const slotPayload = params.equipmentItems.flatMap((item) =>
    params.timeSlotIds.map((timeSlotId) => ({
      booking_id: params.bookingId,
      equipment_item_id: item.id,
      time_slot_id: timeSlotId,
    })))

  await api.post('/public/booking_equipment_items/batch', itemPayload)
  await api.post('/public/booking_equipment_time_slots/batch', slotPayload)
}

export async function deleteBookingEquipment(api: ApiClient, bookingId: ID) {
  const [items, slots] = await Promise.all([
    api.get<ScaffoldListResponse<{ id: ID }>>('/public/booking_equipment_items', {
      pageSize: 100,
      filter: filter('booking_id', 'eq', bookingId),
    }),
    api.get<ScaffoldListResponse<{ id: ID }>>('/public/booking_equipment_time_slots', {
      pageSize: 500,
      filter: filter('booking_id', 'eq', bookingId),
    }),
  ])
  const itemIds = toScaffoldList(items, (item) => item).items.map((item) => item.id)
  const slotIds = toScaffoldList(slots, (item) => item).items.map((item) => item.id)
  await Promise.all([
    ...itemIds.map((id) => api.delete(`/public/booking_equipment_items/${id}`)),
    ...slotIds.map((id) => api.delete(`/public/booking_equipment_time_slots/${id}`)),
  ])
}

function equipmentPayload(input: EquipmentItemInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    unit_price: Math.max(0, Math.round(input.unitPrice)),
    image_url: input.imageUrl?.trim() || undefined,
    is_active: input.isActive ?? true,
    display_order: input.displayOrder ?? 0,
    metadata: JSON.stringify(input.metadata ?? {}),
  }
}
