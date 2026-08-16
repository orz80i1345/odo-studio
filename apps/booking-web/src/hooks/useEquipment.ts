import { useQuery } from '@tanstack/react-query'
import { equipmentApi, queryKeys, type ID } from '@studio/shared'
import { api } from '../lib'

export function useEquipmentItems() {
  return useQuery({
    queryKey: queryKeys.equipment.active,
    queryFn: () => equipmentApi.listEquipmentItems(api, { activeOnly: true }),
  })
}

export function useEquipmentReservations(timeSlotIds: ID[] | undefined) {
  return useQuery({
    queryKey: queryKeys.equipment.availability(timeSlotIds),
    queryFn: () => equipmentApi.listBookingEquipmentTimeSlots(api, { timeSlotIds }),
    enabled: !!timeSlotIds && timeSlotIds.length > 0,
  })
}

export function useBookingEquipment(bookingId: ID | undefined) {
  return useQuery({
    queryKey: bookingId ? queryKeys.equipment.booking(bookingId) : ['equipment', 'booking', 'noop'],
    queryFn: () => equipmentApi.listBookingEquipmentItems(api, bookingId!),
    enabled: !!bookingId,
  })
}
