/**
 * studio.ts
 * 攝影棚型別，對應 schema 的 studios / studio_images。
 */
import type { ID, DateString } from './common'

export interface StudioImage {
  id: ID
  studioId: ID
  url: string
  altText?: string
  caption?: string
  isCover: boolean
  displayOrder: number
}

export interface Studio {
  id: ID
  slug: string
  name: string
  description: string
  address?: string
  floor?: string
  areaPing: number
  capacity?: number
  features: string[]                        // 對應 features JSONB
  defaultHourlyPrice: number
  minBookingMinutes: number
  maxBookingMinutes: number
  bookingIncrementMinutes: number
  advanceBookingDays: number
  cancellationHours: number
  images: StudioImage[]
  coverUrl?: string
  isActive: boolean
  createdAt: DateString
  updatedAt: DateString
}
