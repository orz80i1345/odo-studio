/**
 * endpoints/studios.ts
 * 攝影棚讀取（前後台共用；後端依角色決定回傳範圍）。
 */
import type { ApiClient } from '../client'
import type { ID, Paginated, Studio } from '../../types'
import {
  filter,
  toScaffoldList,
  toStudio,
  toStudioImage,
  unwrapItem,
  unwrapList,
  type RawStudio,
  type RawStudioImage,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

export async function listStudios(api: ApiClient, params?: { page?: number; pageSize?: number }) {
  const res = await api.get<ScaffoldListResponse<RawStudio>>('/public/studios', {
    page: params?.page,
    pageSize: params?.pageSize ?? 50,
    filter: filter('is_active', 'eq', true),
    sort: 'display_order',
  })
  const page = unwrapList(res)
  const images = await listStudioImages(api, page.items.map((studio) => studio.id))
  return {
    ...page,
    items: page.items.map((studio) => toStudio(studio, images.filter((img) => img.studioId === studio.id))),
  } satisfies Paginated<Studio>
}

export async function getStudio(api: ApiClient, studioIdOrSlug: ID | string) {
  const numericId = typeof studioIdOrSlug === 'number' || /^\d+$/.test(String(studioIdOrSlug))
  const raw = numericId
    ? unwrapItem(await api.get<ScaffoldItemResponse<RawStudio>>(`/public/studios/${studioIdOrSlug}`))
    : unwrapList(await api.get<ScaffoldListResponse<RawStudio>>('/public/studios', {
        pageSize: 1,
        filter: [filter('slug', 'eq', studioIdOrSlug), filter('is_active', 'eq', true)],
      })).items[0]

  if (!raw) return undefined as unknown as Studio
  const images = await listStudioImages(api, [raw.id])
  return toStudio(raw, images)
}

async function listStudioImages(api: ApiClient, studioIds: ID[]) {
  if (studioIds.length === 0) return []
  const res = await api.get<ScaffoldListResponse<RawStudioImage>>('/public/studio_images', {
    pageSize: 200,
    filter: filter('studio_id', 'in', studioIds.join(',')),
    sort: 'display_order',
  })
  return toScaffoldList(res, toStudioImage).items
}
