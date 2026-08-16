/**
 * pricing.ts
 * 定價方案，對應 schema 的 pricing_plans。
 */
import type { ID, DateString } from './common'

export type PricingPlanType = 'hourly' | 'package' | 'flat'

export interface PricingPlan {
  id: ID
  studioId: ID
  name: string
  planType: PricingPlanType
  hourlyPrice: number
  packagePrice?: number
  packageHours?: number
  /** 星期 0=Sun..6=Sat */
  appliesToWeekdays: number[]
  startMinute?: number
  endMinute?: number
  effectiveFrom?: DateString
  effectiveTo?: DateString
  minHours: number
  maxHours?: number
  priority: number
  isActive: boolean
}

export interface ScenePrice {
  id: ID
  sceneId: ID
  hourlyPrice: number
  effectiveFrom?: DateString
  effectiveTo?: DateString
  isActive: boolean
  metadata: Record<string, unknown>
  createdAt: DateString
  updatedAt: DateString
}

export type StudioPriceType = 'buyout'

export interface StudioPrice {
  id: ID
  studioId: ID
  priceType: StudioPriceType
  hourlyPrice: number
  effectiveFrom?: DateString
  effectiveTo?: DateString
  isActive: boolean
  metadata: Record<string, unknown>
  createdAt: DateString
  updatedAt: DateString
}
