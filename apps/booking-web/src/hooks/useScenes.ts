/**
 * useScenes / useScene — 佈景列表與詳細。
 */
import { useQuery } from '@tanstack/react-query'
import { queryKeys, scenesApi, type ID } from '@studio/shared'
import { api } from '../lib'

export function useScenes(studioId?: ID) {
  return useQuery({
    queryKey: queryKeys.scenes.all(studioId),
    queryFn: () => scenesApi.listScenes(api, { studioId }),
  })
}

export function useScene(idOrSlug: ID | string | undefined) {
  return useQuery({
    queryKey: idOrSlug ? queryKeys.scenes.detail(idOrSlug) : ['scenes', 'noop'],
    queryFn: () => scenesApi.getScene(api, idOrSlug!),
    enabled: !!idOrSlug,
  })
}
