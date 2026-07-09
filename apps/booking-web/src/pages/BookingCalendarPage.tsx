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
import { Spinner } from '@studio/shared'
import { useStudio } from '../hooks/useStudios'
import { MonthCalendar } from '../components/Calendar/MonthCalendar'
import { TimeSlotPicker } from '../components/Calendar/TimeSlotPicker'
import { PageHeader } from '../components/ui/PageHeader'

export function BookingCalendarPage() {
  const { studioId } = useParams<{ studioId: string }>()
  const nav = useNavigate()

  const studioIdNum = studioId ? Number(studioId) : undefined
  const { data: studio, isLoading } = useStudio(studioIdNum)

  const [yearMonth, setYearMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const eyebrow = useMemo(() => (studio ? `預約 · ${studio.name}` : '預約'), [studio])

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!studio) return <p className="py-16 text-center text-ink-2">找不到攝影棚。</p>

  function onSlotConfirm({ startAt, endAt }: { startAt: string; endAt: string }) {
    const qs = new URLSearchParams({ start: startAt, end: endAt }).toString()
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
              onConfirm={onSlotConfirm}
            />
          )}
        </div>

        {/* 側欄：空間摘要 */}
        <aside className="h-fit rounded-xl border border-line bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-3">Studio</p>
          <h3 className="mt-2 font-serif text-2xl text-ink">{studio.name}</h3>
          {studio.address && (
            <p className="mt-2 text-sm text-ink-2">{studio.address}</p>
          )}
          <dl className="mt-5 space-y-2 border-t border-line pt-5 text-sm">
            <Row label="每小時" value={`NT$ ${studio.defaultHourlyPrice.toLocaleString()} 起`} />
            <Row label="最少" value={`${studio.minBookingMinutes / 60} 小時`} />
            <Row label="每一單位" value={`${studio.bookingIncrementMinutes} 分鐘`} />
            <Row label="可提前" value={`${studio.advanceBookingDays} 天`} />
            <Row label="取消期限" value={`${studio.cancellationHours} 小時前`} />
          </dl>
          <p className="mt-5 rounded-md bg-brand-subtle/60 p-3 text-xs text-brand-subtle-ink">
            假日與尖峰時段價格會不同，實際以「選時段」時顯示的金額為準。
          </p>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  )
}
