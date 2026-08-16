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
    <div className="space-y-16 md:space-y-24">
      <PageHeader
        eyebrow="03 / Pricing"
        title="價格"
        subtitle="可預約單一佈景或包場；選擇 2 個以上佈景會自動以包場價格計算。"
      />
      {loadingPrices && <div className="py-16 text-center"><Spinner /></div>}

      {!loadingPrices && studio && (
        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-[11px] uppercase tracking-[0.22em] text-ink-3">
              <tr>
                <th className="py-5 pr-4 text-left">Item</th>
                <th className="px-4 py-5 text-left">Type</th>
                <th className="px-4 py-5 text-right">Price / hr</th>
                <th className="px-4 py-5 text-right">Minimum</th>
                <th className="py-5 pl-4 text-right">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <td className="py-7 pr-4 font-serif text-3xl text-ink">{studio.name}</td>
                <td className="px-4 py-7 text-ink-2">包場</td>
                <td className="px-4 py-7 text-right font-serif text-4xl text-ink">
                  NT$ {(buyoutPrice?.hourlyPrice ?? studio.defaultHourlyPrice).toLocaleString()}
                </td>
                <td className="px-4 py-7 text-right text-ink-2">{formatMinutes(studio.minBookingMinutes)}</td>
                <td className="py-7 pl-4 text-right text-ink-2">{studio.bookingIncrementMinutes} 分鐘</td>
              </tr>
              {scenes?.items.map((scene) => (
                <tr key={scene.id}>
                  <td className="py-7 pr-4 font-serif text-3xl text-ink">{scene.name}</td>
                  <td className="px-4 py-7 text-ink-2">佈景</td>
                  <td className="px-4 py-7 text-right font-serif text-4xl text-ink">
                    NT$ {(scenePriceById.get(scene.id) ?? studio.defaultHourlyPrice).toLocaleString()}
                  </td>
                  <td className="px-4 py-7 text-right text-ink-2">{formatMinutes(studio.minBookingMinutes)}</td>
                  <td className="py-7 pl-4 text-right text-ink-2">{studio.bookingIncrementMinutes} 分鐘</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-8 border-t border-line pt-10 text-sm md:grid-cols-[220px_1fr]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">Notes</p>
        <ul className="max-w-2xl space-y-3 leading-7 text-ink-2">
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
