/**
 * endpoints/pricing.ts
 * 定價方案列表（前台用來畫價格頁）。
 */
import type { ApiClient } from '../client'
import type { ID, PricingPlan } from '../../types'
import { filter, toScaffoldList, toPricingPlan, type RawPricingPlan, type ScaffoldListResponse } from './scaffold'

export async function listPricingPlans(api: ApiClient, params?: { studioId?: ID }) {
  const filters = [filter('is_active', 'eq', true)]
  if (params?.studioId) filters.push(filter('studio_id', 'eq', params.studioId))
  const res = await api.get<ScaffoldListResponse<RawPricingPlan>>('/public/pricing_plans', {
    pageSize: 100,
    filter: filters,
    sort: 'priority',
  })
  return toScaffoldList(res, toPricingPlan).items satisfies PricingPlan[]
}
