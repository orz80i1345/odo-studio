/**
 * endpoints/pricing.ts
 * 定價方案列表（前台用來畫價格頁）。
 */
import type { ApiClient } from '../client'
import type { ID, PricingPlan } from '../../types'

export function listPricingPlans(api: ApiClient, params?: { studioId?: ID }) {
  return api.get<PricingPlan[]>('/pricing-plans', params as Record<string, string | number | undefined>)
}
