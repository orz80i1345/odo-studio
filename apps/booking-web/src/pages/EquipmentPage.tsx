import { Link } from 'react-router'
import { PackageOpen } from 'lucide-react'
import { Spinner } from '@studio/shared'
import { useEquipmentItems } from '../hooks/useEquipment'
import { PageHeader } from '../components/ui/PageHeader'
import { SmartImage } from '../components/ui/SmartImage'

export function EquipmentPage() {
  const { data, isLoading, isError } = useEquipmentItems()
  const items = data?.items ?? []

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Equipment Rental"
        title="器材租借"
        subtitle="器材可在送出場地預約前一併選擇；實際可租狀態會依預約時段即時確認。"
        actions={
          <Link to="/spaces" className="text-sm text-ink-2 hover:text-ink">
            查看空間 →
          </Link>
        }
      />

      {isLoading && <div className="py-20 text-center"><Spinner /></div>}

      {isError && (
        <div className="rounded-xl border border-danger/30 bg-danger-subtle p-8 text-center text-sm text-danger-subtle-ink">
          器材資料暫時無法載入，請稍後再試。
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <PackageOpen className="mx-auto size-8 text-ink-3" />
          <h2 className="mt-4 font-serif text-2xl text-ink">目前沒有開放租借的器材</h2>
          <p className="mt-2 text-sm text-ink-2">器材上架後會自動顯示在這裡。</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article key={item.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sunken">
                {item.imageUrl ? (
                  <SmartImage
                    src={item.imageUrl}
                    alt={item.name}
                    priority={index < 3}
                    className="transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <PackageOpen className="size-10 text-ink-3/60" />
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-start justify-between gap-4 border-t border-line pt-4">
                <div>
                  <h2 className="font-serif text-2xl text-ink">{item.name}</h2>
                  {item.description && <p className="mt-2 text-sm leading-6 text-ink-2">{item.description}</p>}
                </div>
                <p className="shrink-0 text-sm font-medium text-ink">NT$ {item.unitPrice.toLocaleString()}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-5 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink">與場地預約一起租借</h2>
          <p className="mt-2 text-sm text-ink-2">選好日期與時段後，可在確認訂單頁加入尚有庫存的器材。</p>
        </div>
        <Link to="/spaces" className="inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover">
          開始預約
        </Link>
      </section>
    </div>
  )
}
