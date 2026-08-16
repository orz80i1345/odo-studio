/**
 * endpoints/pricing.ts
 * 定價方案列表（前台用來畫價格頁）。
 */
import type { ApiClient } from '../client'
import type { ID, PricingPlan, ScenePrice, StudioPrice } from '../../types'
import {
  filter,
  toScaffoldList,
  toPricingPlan,
  toScenePrice,
  toStudioPrice,
  unwrapItem,
  type RawPricingPlan,
  type RawScenePrice,
  type RawStudioPrice,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

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

export async function listScenePrices(api: ApiClient, params?: { sceneIds?: ID[]; activeOnly?: boolean }) {
  const filters: string[] = []
  if (params?.activeOnly ?? true) filters.push(filter('is_active', 'eq', true))
  if (params?.sceneIds?.length) filters.push(filter('scene_id', 'in', params.sceneIds.join(',')))
  const res = await api.get<ScaffoldListResponse<RawScenePrice>>('/public/scene_prices', {
    pageSize: 100,
    filter: filters,
    sort: 'scene_id,-created_at',
  })
  return toScaffoldList(res, toScenePrice).items satisfies ScenePrice[]
}

export async function saveScenePrice(api: ApiClient, input: { sceneId: ID; hourlyPrice: number; priceId?: ID; isActive?: boolean }) {
  const payload = {
    scene_id: input.sceneId,
    hourly_price: input.hourlyPrice,
    is_active: input.isActive ?? true,
    metadata: '{}',
  }
  const res = input.priceId
    ? await api.patch<ScaffoldItemResponse<RawScenePrice>>(`/public/scene_prices/${input.priceId}`, payload)
    : await api.post<ScaffoldItemResponse<RawScenePrice>>('/public/scene_prices', payload)
  return toScenePrice(unwrapItem(res))
}

export async function listStudioPrices(api: ApiClient, params?: { studioIds?: ID[]; priceType?: StudioPrice['priceType']; activeOnly?: boolean }) {
  const filters: string[] = []
  if (params?.activeOnly ?? true) filters.push(filter('is_active', 'eq', true))
  if (params?.studioIds?.length) filters.push(filter('studio_id', 'in', params.studioIds.join(',')))
  if (params?.priceType) filters.push(filter('price_type', 'eq', params.priceType))
  const res = await api.get<ScaffoldListResponse<RawStudioPrice>>('/public/studio_prices', {
    pageSize: 100,
    filter: filters,
    sort: 'studio_id,-created_at',
  })
  return toScaffoldList(res, toStudioPrice).items satisfies StudioPrice[]
}

export async function saveStudioPrice(api: ApiClient, input: { studioId: ID; hourlyPrice: number; priceId?: ID; priceType?: StudioPrice['priceType']; isActive?: boolean }) {
  const payload = {
    studio_id: input.studioId,
    price_type: input.priceType ?? 'buyout',
    hourly_price: input.hourlyPrice,
    is_active: input.isActive ?? true,
    metadata: '{}',
  }
  const res = input.priceId
    ? await api.patch<ScaffoldItemResponse<RawStudioPrice>>(`/public/studio_prices/${input.priceId}`, payload)
    : await api.post<ScaffoldItemResponse<RawStudioPrice>>('/public/studio_prices', payload)
  return toStudioPrice(unwrapItem(res))
}
