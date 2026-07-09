import { useQuery } from '@tanstack/react-query'
import { queryKeys, bookingsApi, type ID } from '@studio/shared'
import { api } from '../lib'
import { useAuth } from '../auth/AuthContext'

/** 我的預約列表；只有登入才會 fetch */
export function useMyBookings() {
  const { isAuthenticated, user } = useAuth()
  return useQuery({
    queryKey: queryKeys.bookings.mine,
    queryFn: () => bookingsApi.listMyBookings(api, { customerEmail: user?.email }),
    enabled: isAuthenticated,
  })
}

export function useBooking(bookingId: ID | undefined) {
  return useQuery({
    queryKey: bookingId ? queryKeys.bookings.detail(bookingId) : ['bookings', 'noop'],
    queryFn: () => bookingsApi.getBooking(api, bookingId!),
    enabled: !!bookingId,
  })
}
