import { useQuery } from '@tanstack/react-query'
import { paymentsApi, queryKeys, type ID } from '@studio/shared'
import { api } from '../lib'

export function useBookingPayments(bookingId: ID | undefined) {
  return useQuery({
    queryKey: bookingId ? queryKeys.payments.booking(bookingId) : ['payments', 'booking', 'noop'],
    queryFn: () => paymentsApi.listBookingPayments(api, bookingId!),
    enabled: !!bookingId,
  })
}
