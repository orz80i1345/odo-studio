/**
 * useCreateBooking — 建立預約後自動 invalidate 「我的預約」列表。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, bookingsApi, type CreateBookingInput } from '@studio/shared'
import { api } from '../lib'

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.createBooking(api, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.mine })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => bookingsApi.cancelBooking(api, id, reason),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.mine })
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking)
    },
  })
}
