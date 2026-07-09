/**
 * endpoints/studios.ts
 * 攝影棚讀取（前後台共用；後端依角色決定回傳範圍）。
 */
import type { ApiClient } from '../client'
import type { ID, Paginated, Studio } from '../../types'

export function listStudios(api: ApiClient, params?: { page?: number; pageSize?: number }) {
  return api.get<Paginated<Studio>>('/studios', params)
}

export function getStudio(api: ApiClient, studioIdOrSlug: ID | string) {
  return api.get<Studio>(`/studios/${studioIdOrSlug}`)
}
