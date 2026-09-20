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
        subtitle="可預約單一空間或包場；選擇 2 個以上空間會自動以包場價格計算。"
      />
      {loadingPrices && <div className="py-16 text-center"><Spinner /></div>}

      {!loadingPrices && studio && (
        <section className="space-y-14">
          <PriceRow
            eyebrow="Full Space"
            title="包場"
            description="保留所有空間，適合需要完整動線、多人團隊或多組場景切換的拍攝。"
            price={buyoutPrice?.hourlyPrice ?? studio.defaultHourlyPrice}
            minimum={formatMinutes(studio.minBookingMinutes)}
            unit={`${studio.bookingIncrementMinutes} 分鐘`}
          />
          {scenes?.items.map((scene, index) => (
            <PriceRow
              key={scene.id}
              eyebrow={`Space ${String(index + 1).padStart(2, '0')}`}
              title={scene.name}
              description={scene.description || '單一空間預約；同時段其它空間仍可能開放預約。'}
              price={scenePriceById.get(scene.id) ?? studio.defaultHourlyPrice}
              minimum={formatMinutes(studio.minBookingMinutes)}
              unit={`${studio.bookingIncrementMinutes} 分鐘`}
            />
          ))}
        </section>
      )}

      <div className="grid gap-8 border-t border-line pt-10 text-sm md:grid-cols-[220px_1fr]">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-3">Notes</p>
        <ul className="max-w-2xl space-y-3 leading-7 text-ink-2">
          <li>此頁顯示目前啟用的空間價格與包場價格；若特定日期或時段另有調整，以選擇時段時顯示的金額為準。</li>
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

function PriceRow({
  eyebrow,
  title,
  description,
  price,
  minimum,
  unit,
}: {
  eyebrow: string
  title: string
  description: string
  price: number
  minimum: string
  unit: string
}) {
  return (
    <article className="grid gap-8 border-t border-line pt-10 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
      <div>
        <p className="text-[10px] uppercase tracking-[0.32em] text-ink-3">{eyebrow}</p>
        <h2 className="mt-5 font-serif text-5xl font-medium leading-[0.98] text-ink md:text-6xl">{title}</h2>
        <p className="mt-6 max-w-xl text-sm leading-8 text-ink-2">{description}</p>
      </div>
      <dl className="border-y border-line py-6 text-sm">
        <div className="flex items-baseline justify-between gap-6">
          <dt className="text-[10px] uppercase tracking-[0.22em] text-ink-3">Price / hr</dt>
          <dd className="font-serif text-4xl leading-none text-ink">NT$ {price.toLocaleString()}</dd>
        </div>
        <div className="mt-5 flex items-baseline justify-between gap-6 border-t border-line pt-5">
          <dt className="text-[10px] uppercase tracking-[0.22em] text-ink-3">Minimum</dt>
          <dd className="text-ink-2">{minimum}</dd>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-6">
          <dt className="text-[10px] uppercase tracking-[0.22em] text-ink-3">Unit</dt>
          <dd className="text-ink-2">{unit}</dd>
        </div>
      </dl>
    </article>
  )
}
