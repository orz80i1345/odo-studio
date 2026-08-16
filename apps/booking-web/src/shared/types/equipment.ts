import type { DateString, ID } from './common'

export interface EquipmentItem {
  id: ID
  name: string
  description?: string
  unitPrice: number
  imageUrl?: string
  isActive: boolean
  displayOrder: number
  metadata: Record<string, unknown>
  createdAt: DateString
  updatedAt: DateString
}

export interface BookingEquipmentItem {
  id: ID
  bookingId: ID
  equipmentItemId: ID
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
  metadata: Record<string, unknown>
  createdAt: DateString
}

export interface BookingEquipmentTimeSlot {
  id: ID
  bookingId: ID
  equipmentItemId: ID
  timeSlotId: ID
  createdAt: DateString
}
