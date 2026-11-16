import { useQuery } from '@tanstack/react-query'
import { pricingApi, queryKeys, type ID } from '@studio/shared'
import { api } from '../lib'
import { configurationQueryPolicy } from '../queryPolicy'

export function useScenePrices(sceneIds: ID[] | undefined) {
  return useQuery({
    queryKey: queryKeys.pricing.scenePrices(sceneIds),
    queryFn: () => pricingApi.listScenePrices(api, { sceneIds }),
    enabled: !!sceneIds && sceneIds.length > 0,
    ...configurationQueryPolicy,
  })
}

export function useStudioBuyoutPrice(studioId: ID | undefined) {
  return useQuery({
    queryKey: queryKeys.pricing.studioPrices(studioId ? [studioId] : undefined),
    queryFn: () => pricingApi.listStudioPrices(api, { studioIds: [studioId!], priceType: 'buyout' }),
    enabled: !!studioId,
    ...configurationQueryPolicy,
    select: (prices) => prices[0],
  })
}
