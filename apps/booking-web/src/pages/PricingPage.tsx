import { Spinner } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { useStudios } from '../hooks/useStudios'

export function PricingPage() {
  const { data: studios, isLoading } = useStudios()

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Pricing"
        title="價格"
        subtitle="價格以攝影棚基本時租為準；實際結帳金額依預約時段上設定的每小時價格計算。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-ink-2">
            <tr>
              <th className="px-4 py-3 text-left">空間</th>
              <th className="px-4 py-3 text-right">單價 / 時</th>
              <th className="px-4 py-3 text-right">最短預約</th>
              <th className="px-4 py-3 text-right">預約單位</th>
              <th className="px-4 py-3 text-right">取消期限</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {studios?.items.map((studio) => (
              <tr key={studio.id} className="hover:bg-sunken">
                <td className="px-4 py-3 text-ink">{studio.name}</td>
                <td className="px-4 py-3 text-right text-ink">NT$ {studio.defaultHourlyPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-ink-2">{formatMinutes(studio.minBookingMinutes)}</td>
                <td className="px-4 py-3 text-right text-ink-2">{studio.bookingIncrementMinutes} 分鐘</td>
                <td className="px-4 py-3 text-right text-ink-2">{studio.cancellationHours} 小時前</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-line bg-brand-subtle/50 p-6 text-sm text-brand-subtle-ink">
        <p className="font-medium">備註</p>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          <li>此頁顯示攝影棚基本時租；若特定日期或時段另有調整，以選擇時段時顯示的金額為準。</li>
          <li>預約總金額會依實際選取的 time slots 加總。</li>
          <li>需先付訂金 30%，尾款依現場或後續通知方式付款。</li>
        </ul>
      </div>
    </div>
  )
}

function formatMinutes(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} 小時`
  return `${minutes} 分鐘`
}
