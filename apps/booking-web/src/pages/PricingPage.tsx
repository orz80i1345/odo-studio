import { Spinner } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { usePricingPlans } from '../hooks/usePricing'
import { useStudios } from '../hooks/useStudios'

export function PricingPage() {
  const { data: plans, isLoading } = usePricingPlans()
  const { data: studios } = useStudios()
  const studioMap = new Map(studios?.items.map((s) => [s.id, s.name]))

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Pricing"
        title="價格方案"
        subtitle="平日與假日定價分開；連續預約 4 小時以上另有優惠，詳見備註。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-ink-2">
            <tr>
              <th className="px-4 py-3 text-left">空間</th>
              <th className="px-4 py-3 text-left">方案</th>
              <th className="px-4 py-3 text-left">適用日</th>
              <th className="px-4 py-3 text-right">單價 / 時</th>
              <th className="px-4 py-3 text-right">最少</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {plans?.map((p) => (
              <tr key={p.id} className="hover:bg-sunken">
                <td className="px-4 py-3 text-ink">{studioMap.get(p.studioId) ?? '—'}</td>
                <td className="px-4 py-3 text-ink">{p.name}</td>
                <td className="px-4 py-3 text-ink-2">{formatWeekdays(p.appliesToWeekdays)}</td>
                <td className="px-4 py-3 text-right text-ink">NT$ {p.hourlyPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-ink-2">{p.minHours} 小時</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-line bg-brand-subtle/50 p-6 text-sm text-brand-subtle-ink">
        <p className="font-medium">備註</p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>國定假日視為假日方案。</li>
          <li>連續 4 小時以上 9 折；6 小時以上 85 折。</li>
          <li>需先付訂金 30%（匯款），現場尾款可用信用卡或現金。</li>
        </ul>
      </div>
    </div>
  )
}

function formatWeekdays(days: number[]): string {
  if (days.length === 7) return '每日'
  const set = new Set(days)
  const weekday = [1,2,3,4,5].every((d) => set.has(d))
  const weekend = [0,6].every((d) => set.has(d))
  if (weekday && !weekend) return '週一至週五'
  if (weekend && !weekday) return '週六、週日'
  const names = ['日','一','二','三','四','五','六']
  return days.map((d) => `週${names[d]}`).join('、')
}
