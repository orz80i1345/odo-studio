/**
 * useStudios / useStudio — 攝影棚列表與單一詳細。
 */
import { useQuery } from '@tanstack/react-query'
import { queryKeys, studiosApi, type ID } from '@studio/shared'
import { api } from '../lib'

export function useStudios() {
  return useQuery({
    queryKey: queryKeys.studios.all,
    queryFn: () => studiosApi.listStudios(api),
  })
}

export function useStudio(idOrSlug: ID | string | undefined) {
  return useQuery({
    queryKey: idOrSlug ? queryKeys.studios.detail(idOrSlug) : ['studios', 'noop'],
    queryFn: () => studiosApi.getStudio(api, idOrSlug!),
    enabled: !!idOrSlug,
  })
}
