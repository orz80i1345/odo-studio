import { Spinner } from '@studio/shared'
import { useMemo } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { useScenePrices, useStudioBuyoutPrice } from '../hooks/usePricing'
import { useScenes } from '../hooks/useScenes'
import { useStudios } from '../hooks/useStudios'

export function PricingPage() {
  const { data: studios, isLoading } = useStudios()
  const studio = studios?.items[0]
  const { data: scenes, isLoading: isScenesLoading } = useScenes(studio?.id)
  const sceneIds = scenes?.items.map((scene) => scene.id) ?? []
  const { data: scenePrices, isLoading: isScenePricesLoading } = useScenePrices(sceneIds)
  const { data: buyoutPrice, isLoading: isBuyoutLoading } = useStudioBuyoutPrice(studio?.id)
  const scenePriceById = useMemo(
    () => new Map((scenePrices ?? []).map((price) => [price.sceneId, price.hourlyPrice])),
    [scenePrices],
  )
  const loadingPrices = isLoading || isScenesLoading || isScenePricesLoading || isBuyoutLoading

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Pricing"
        title="價格"
        subtitle="可預約單一佈景或包場；選擇 2 個以上佈景會自動以包場價格計算。"
      />
      {loadingPrices && <div className="py-16 text-center"><Spinner /></div>}

      {!loadingPrices && studio && (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-sunken text-xs uppercase tracking-wide text-ink-2">
              <tr>
                <th className="px-4 py-3 text-left">項目</th>
                <th className="px-4 py-3 text-left">類型</th>
                <th className="px-4 py-3 text-right">單價 / 時</th>
                <th className="px-4 py-3 text-right">最短預約</th>
                <th className="px-4 py-3 text-right">預約單位</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr className="hover:bg-sunken">
                <td className="px-4 py-3 text-ink">{studio.name}</td>
                <td className="px-4 py-3 text-ink-2">包場</td>
                <td className="px-4 py-3 text-right text-ink">
                  NT$ {(buyoutPrice?.hourlyPrice ?? studio.defaultHourlyPrice).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-ink-2">{formatMinutes(studio.minBookingMinutes)}</td>
                <td className="px-4 py-3 text-right text-ink-2">{studio.bookingIncrementMinutes} 分鐘</td>
              </tr>
              {scenes?.items.map((scene) => (
                <tr key={scene.id} className="hover:bg-sunken">
                  <td className="px-4 py-3 text-ink">{scene.name}</td>
                  <td className="px-4 py-3 text-ink-2">佈景</td>
                  <td className="px-4 py-3 text-right text-ink">
                    NT$ {(scenePriceById.get(scene.id) ?? studio.defaultHourlyPrice).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-2">{formatMinutes(studio.minBookingMinutes)}</td>
                  <td className="px-4 py-3 text-right text-ink-2">{studio.bookingIncrementMinutes} 分鐘</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl border border-line bg-brand-subtle/50 p-6 text-sm text-brand-subtle-ink">
        <p className="font-medium">備註</p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>此頁顯示目前啟用的佈景價格與包場價格；若特定日期或時段另有調整，以選擇時段時顯示的金額為準。</li>
          <li>預約總金額會依實際選取的 time slots 加總。</li>
          <li>目前採全額匯款付款；實際應付金額以預約完成頁顯示為準。</li>
        </ul>
      </div>
    </div>
  )
}

function formatMinutes(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} 小時`
  return `${minutes} 分鐘`
}
