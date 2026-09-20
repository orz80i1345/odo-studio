/**
 * 月曆 availability 與單日時段。
 */
import { useQuery } from '@tanstack/react-query'
import { queryKeys, availabilityApi, type ID } from '@studio/shared'
import { api } from '../lib'

export function useMonthAvailability(studioId: ID | undefined, yearMonth: string) {
  return useQuery({
    queryKey: studioId ? queryKeys.studios.availability(studioId, yearMonth) : ['availability', 'noop'],
    queryFn: () => availabilityApi.getMonthAvailability(api, studioId!, yearMonth),
    enabled: !!studioId,
    staleTime: 60_000,
  })
}

export function useDaySlots(studioId: ID | undefined, date: string | null) {
  return useQuery({
    queryKey: studioId && date ? queryKeys.studios.daySlots(studioId, date) : ['day-slots', 'noop'],
    queryFn: () => availabilityApi.getDaySlots(api, studioId!, date!),
    enabled: !!studioId && !!date,
    staleTime: 10_000,
  })
}
