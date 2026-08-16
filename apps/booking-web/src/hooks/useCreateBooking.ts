/**
 * useCreateBooking — 建立預約後自動 invalidate 「我的預約」列表。
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, bookingsApi, type Booking, type BookingPaymentProof, type CreateBookingInput } from '@studio/shared'
import { api } from '../lib'

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBookingInput) => bookingsApi.createBooking(api, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.mine })
      qc.invalidateQueries({ queryKey: queryKeys.studios.all })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => bookingsApi.cancelBooking(api, id, reason),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.mine })
      qc.invalidateQueries({ queryKey: queryKeys.studios.all })
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking)
    },
  })
}

export function useSubmitPaymentProof() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ booking, proof }: { booking: Booking; proof: BookingPaymentProof }) =>
      bookingsApi.submitPaymentProof(api, booking, proof),
    onSuccess: (booking) => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.mine })
      qc.setQueryData(queryKeys.bookings.detail(booking.id), booking)
    },
  })
}
