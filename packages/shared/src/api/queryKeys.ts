/**
 * queryKeys.ts
 * TanStack Query key 工廠。
 */
import type { ID } from '../types'

export const queryKeys = {
  studios: {
    all: ['studios'] as const,
    detail: (studioIdOrSlug: ID | string) => ['studios', studioIdOrSlug] as const,
    availability: (studioId: ID, yearMonth: string) =>
      ['studios', studioId, 'availability', yearMonth] as const,
    daySlots: (studioId: ID, date: string) =>
      ['studios', studioId, 'day-slots', date] as const,
  },
  scenes: {
    all: (studioId?: ID) => (studioId ? (['scenes', { studioId }] as const) : (['scenes'] as const)),
    detail: (sceneIdOrSlug: ID | string) => ['scenes', sceneIdOrSlug] as const,
  },
  pricing: {
    plans: (studioId?: ID) => ['pricing-plans', { studioId }] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    mine: ['bookings', 'mine'] as const,
    detail: (bookingId: ID) => ['bookings', bookingId] as const,
  },
  bankAccounts: {
    active: ['bank-accounts', 'active'] as const,
  },
  customerAuth: {
    me: ['customer', 'auth', 'me'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
} as const
