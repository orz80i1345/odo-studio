/**
 * BookingCalendarPage — 預約流程第 1 步：選日期 + 時段
 *
 * 路徑：/book/:studioId（需登入；ProtectedRoute 已包覆）
 *
 * 流程：
 *   1. 讀 studio → 取得 minBookingMinutes 與名稱
 *   2. 月曆呈現 availability（useMonthAvailability）
 *   3. 點日期 → 下方展開 TimeSlotPicker
 *   4. 選時段 → navigate 到 /book/:studioId/confirm?start=<ISO>&end=<ISO>
 *
 * 月份切換：狀態內建 yearMonth（預設當月），MonthCalendar 呼叫 onChangeMonth 更新。
 */
import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Link, useNavigate, useParams } from 'react-router'
import { Spinner, cn, type ID } from '@studio/shared'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { useScenePrices, useStudioBuyoutPrice } from '../hooks/usePricing'
import { MonthCalendar } from '../components/Calendar/MonthCalendar'
import { TimeSlotPicker } from '../components/Calendar/TimeSlotPicker'
import { PageHeader } from '../components/ui/PageHeader'

export function BookingCalendarPage() {
  const { studioId } = useParams<{ studioId: string }>()
  const nav = useNavigate()

  const studioIdNum = studioId ? Number(studioId) : undefined
  const { data: studio, isLoading } = useStudio(studioIdNum)
  const { data: scenes } = useScenes(studioIdNum)
  const sceneIds = scenes?.items.map((scene) => scene.id) ?? []
  const { data: scenePrices } = useScenePrices(sceneIds)
  const { data: buyoutPrice } = useStudioBuyoutPrice(studioIdNum)
  const scenePriceById = useMemo(
    () => new Map((scenePrices ?? []).map((price) => [price.sceneId, price.hourlyPrice])),
    [scenePrices],
  )

  const [yearMonth, setYearMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSceneIds, setSelectedSceneIds] = useState<ID[]>([])
  const [forceBuyout, setForceBuyout] = useState(false)

  const eyebrow = useMemo(() => (studio ? `預約 · ${studio.name}` : '預約'), [studio])
  const bookingMode = forceBuyout || selectedSceneIds.length >= 2 ? 'buyout' : 'scenes'

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!studio) return <p className="py-16 text-center text-ink-2">找不到攝影棚。</p>

  function onSlotConfirm({ startAt, endAt, sceneIds, bookingMode }: { startAt: string; endAt: string; sceneIds: number[]; bookingMode: 'scenes' | 'buyout' }) {
    const qs = new URLSearchParams({
      start: startAt,
      end: endAt,
      scenes: sceneIds.join(','),
      mode: bookingMode,
    }).toString()
    nav(`/book/${studioIdNum}/confirm?${qs}`)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={eyebrow}
        title="選擇日期與時段"
        subtitle="先選一個日期，再選連續的時段區間；之後會帶你去填聯絡資料。"
        actions={
          <Link to={`/studios/${studio.slug}`} className="text-sm text-ink-2 hover:text-ink">
            ← 回空間介紹
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <MonthCalendar
            studioId={studio.id}
            yearMonth={yearMonth}
            onChangeMonth={(next) => {
              setYearMonth(next)
              setSelectedDate(null)      // 換月時清掉已選日期
            }}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          {selectedDate && (
            <TimeSlotPicker
              studioId={studio.id}
              date={selectedDate}
              minBookingMinutes={studio.minBookingMinutes}
              scenes={scenes?.items ?? []}
              scenePrices={scenePrices ?? []}
              buyoutHourlyPrice={buyoutPrice?.hourlyPrice}
              fallbackHourlyPrice={studio.defaultHourlyPrice}
              selectedSceneIds={selectedSceneIds}
              onChangeSelectedSceneIds={setSelectedSceneIds}
              forceBuyout={forceBuyout}
              onChangeForceBuyout={setForceBuyout}
              onConfirm={onSlotConfirm}
            />
          )}
        </div>

        {/* 側欄：預約方式 */}
        <aside className="h-fit rounded-xl border border-line bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-3">Booking Type</p>
          <h3 className="mt-2 font-serif text-2xl text-ink">預約方式</h3>
          <div className="mt-5 space-y-3 border-t border-line pt-5">
            <ModeCard
              active={bookingMode === 'scenes'}
              title="佈景預約"
              description="選擇單一佈景；同時段其他佈景仍可被預約。"
              onClick={() => {
                setForceBuyout(false)
                if (selectedSceneIds.length >= 2) setSelectedSceneIds([])
              }}
            />
            <ModeCard
              active={bookingMode === 'buyout'}
              title="包場"
              description={`保留所有佈景${buyoutPrice ? `，NT$ ${buyoutPrice.hourlyPrice.toLocaleString()}/hr` : ''}`}
              onClick={() => {
                setForceBuyout(true)
                setSelectedSceneIds(sceneIds)
              }}
            />
          </div>
          {scenes && scenes.items.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-line pt-5">
              <p className="text-xs uppercase tracking-[0.16em] text-ink-3">Scene Prices</p>
              <dl className="space-y-2 text-sm">
                {scenes.items.map((scene) => (
                  <div key={scene.id} className="flex items-baseline justify-between gap-4">
                    <dt className="min-w-0 truncate text-ink-2">{scene.name}</dt>
                    <dd className="shrink-0 text-ink">
                      NT$ {(scenePriceById.get(scene.id) ?? studio.defaultHourlyPrice).toLocaleString()}/hr
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="mt-5 rounded-md bg-sunken p-3 text-sm text-ink-2">
            <div className="flex justify-between gap-4">
              <span>目前</span>
              <span className="text-ink">{bookingMode === 'buyout' ? '包場' : '佈景預約'}</span>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span>已選佈景</span>
              <span className="text-ink">{bookingMode === 'buyout' ? '全部' : `${selectedSceneIds.length} 個`}</span>
            </div>
          </div>
          <p className="mt-5 rounded-md bg-brand-subtle/60 p-3 text-xs text-brand-subtle-ink">
            選擇 2 個以上佈景會自動以包場價格計算。
          </p>
        </aside>
      </div>
    </div>
  )
}

function ModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border p-4 text-left transition-colors',
        active
          ? 'border-brand bg-brand-subtle text-brand-subtle-ink'
          : 'border-line bg-sunken text-ink-2 hover:border-line-strong hover:text-ink',
      )}
    >
      <span className="block font-medium">{title}</span>
      <span className="mt-1 block text-xs opacity-80">{description}</span>
    </button>
  )
}
