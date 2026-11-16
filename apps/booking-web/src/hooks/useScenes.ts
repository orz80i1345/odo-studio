/**
 * useScenes / useScene — 佈景列表與詳細。
 */
import { useQuery } from '@tanstack/react-query'
import { queryKeys, scenesApi, type ID } from '@studio/shared'
import { api } from '../lib'
import { catalogQueryPolicy } from '../queryPolicy'

export function useScenes(studioId?: ID) {
  return useQuery({
    queryKey: queryKeys.scenes.all(studioId),
    queryFn: () => scenesApi.listScenes(api, { studioId }),
    ...catalogQueryPolicy,
  })
}

export function useScene(idOrSlug: ID | string | undefined) {
  return useQuery({
    queryKey: idOrSlug ? queryKeys.scenes.detail(idOrSlug) : ['scenes', 'noop'],
    queryFn: () => scenesApi.getScene(api, idOrSlug!),
    enabled: !!idOrSlug,
    ...catalogQueryPolicy,
  })
}
