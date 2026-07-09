import { useQuery } from '@tanstack/react-query'
import { queryKeys, pricingApi, type ID } from '@studio/shared'
import { api } from '../lib'

export function usePricingPlans(studioId?: ID) {
  return useQuery({
    queryKey: queryKeys.pricing.plans(studioId),
    queryFn: () => pricingApi.listPricingPlans(api, { studioId }),
  })
}
