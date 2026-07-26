/**
 * endpoints/scenes.ts
 * 佈景列表 / 詳細。
 */
import type { ApiClient } from '../client'
import type { ID, Paginated, Scene } from '../../types'
import {
  filter,
  toScene,
  toSceneImage,
  unwrapItem,
  unwrapList,
  type RawScene,
  type RawSceneImage,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

export async function listScenes(api: ApiClient, params?: { studioId?: ID; page?: number; pageSize?: number }) {
  const filters = [filter('is_active', 'eq', true)]
  if (params?.studioId) filters.push(filter('studio_id', 'eq', params.studioId))

  const res = await api.get<ScaffoldListResponse<RawScene>>('/public/scenes', {
    page: params?.page,
    pageSize: params?.pageSize ?? 100,
    filter: filters,
    sort: 'display_order',
  })
  const page = unwrapList(res)
  const images = await listSceneImages(api, page.items.map((scene) => scene.id))
  return {
    ...page,
    items: page.items.map((scene) => toScene(scene, images.filter((img) => img.sceneId === scene.id))),
  } satisfies Paginated<Scene>
}

export async function getScene(api: ApiClient, sceneIdOrSlug: ID | string) {
  const numericId = typeof sceneIdOrSlug === 'number' || /^\d+$/.test(String(sceneIdOrSlug))
  const raw = numericId
    ? unwrapItem(await api.get<ScaffoldItemResponse<RawScene>>(`/public/scenes/${sceneIdOrSlug}`))
    : unwrapList(await api.get<ScaffoldListResponse<RawScene>>('/public/scenes', {
        pageSize: 1,
        filter: [filter('slug', 'eq', sceneIdOrSlug), filter('is_active', 'eq', true)],
      })).items[0]

  if (!raw) return undefined as unknown as Scene
  const images = await listSceneImages(api, [raw.id])
  return toScene(raw, images)
}

async function listSceneImages(api: ApiClient, sceneIds: ID[]) {
  if (sceneIds.length === 0) return []
  const res = await api.get<ScaffoldListResponse<RawSceneImage>>('/public/scene_images', {
    pageSize: 200,
    filter: filter('scene_id', 'in', sceneIds.join(',')),
    sort: 'display_order',
  })
  return unwrapList(res).items.map(toSceneImage)
}
