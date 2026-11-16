import { useQuery } from '@tanstack/react-query'
import { equipmentApi, queryKeys, type ID } from '@studio/shared'
import { api } from '../lib'
import { catalogQueryPolicy, liveAvailabilityQueryPolicy } from '../queryPolicy'

export function useEquipmentItems() {
  return useQuery({
    queryKey: queryKeys.equipment.active,
    queryFn: () => equipmentApi.listEquipmentItems(api, { activeOnly: true }),
    ...catalogQueryPolicy,
  })
}

export function useEquipmentReservations(timeSlotIds: ID[] | undefined) {
  return useQuery({
    queryKey: queryKeys.equipment.availability(timeSlotIds),
    queryFn: () => equipmentApi.listBookingEquipmentTimeSlots(api, { timeSlotIds }),
    enabled: !!timeSlotIds && timeSlotIds.length > 0,
    ...liveAvailabilityQueryPolicy,
  })
}

export function useBookingEquipment(bookingId: ID | undefined) {
  return useQuery({
    queryKey: bookingId ? queryKeys.equipment.booking(bookingId) : ['equipment', 'booking', 'noop'],
    queryFn: () => equipmentApi.listBookingEquipmentItems(api, bookingId!),
    enabled: !!bookingId,
  })
}
