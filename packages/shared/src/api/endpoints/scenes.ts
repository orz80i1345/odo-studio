/**
 * endpoints/scenes.ts
 * 佈景列表 / 詳細。
 */
import type { ApiClient } from '../client'
import type { ID, Paginated, Scene } from '../../types'

export function listScenes(api: ApiClient, params?: { studioId?: ID; page?: number; pageSize?: number }) {
  return api.get<Paginated<Scene>>('/scenes', params as Record<string, string | number | undefined>)
}

export function getScene(api: ApiClient, sceneIdOrSlug: ID | string) {
  return api.get<Scene>(`/scenes/${sceneIdOrSlug}`)
}
