/**
 * MonthCalendar — 月曆本體。
 * - 顯示一整個月，週日起。
 * - 依 useMonthAvailability 的結果標示：可預約／已滿／公休。
 * - 點日格 → onSelectDate(iso)；父層負責在下方渲染時段。
 * - 週工作日 header 走 ink-3；今日 ring-brand；週末底 sunken。
 */
import { addMonths, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, type DayAvailability, type ID } from '@studio/shared'
import { useMonthAvailability } from '../../hooks/useAvailability'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

interface Props {
  studioId: ID
  /** yyyy-MM */
  yearMonth: string
  onChangeMonth: (yearMonth: string) => void
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

export function MonthCalendar({ studioId, yearMonth, onChangeMonth, selectedDate, onSelectDate }: Props) {
  const { data, isLoading } = useMonthAvailability(studioId, yearMonth)

  const [y, m] = yearMonth.split('-').map(Number)
  const monthStart = new Date(y, m - 1, 1)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })

  const dayMap = new Map<string, DayAvailability>()
  data?.days.forEach((d) => dayMap.set(d.date, d))

  const cells: (Date | null)[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push(d)
  }
  // 只顯示到「包含當月最後一日的那一週」為止
  const trimmed = cells.slice(
    0,
    cells.findIndex(
      (d) => d && d.getMonth() !== monthStart.getMonth() && d > monthStart && d.getDay() === 0,
    ) || 42,
  )

  const goto = (delta: number) => {
    const next = format(addMonths(startOfMonth(monthStart), delta), 'yyyy-MM')
    onChangeMonth(next)
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      {/* header：月份切換 */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <button
          type="button"
          onClick={() => goto(-1)}
          className="rounded-md p-1.5 text-ink-2 hover:bg-sunken hover:text-ink"
          aria-label="上個月"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="font-serif text-lg text-ink">{format(monthStart, 'yyyy 年 M 月')}</div>
        <button
          type="button"
          onClick={() => goto(1)}
          className="rounded-md p-1.5 text-ink-2 hover:bg-sunken hover:text-ink"
          aria-label="下個月"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* 週工作日列 */}
      <div className="grid grid-cols-7 border-b border-line text-center text-xs text-ink-3">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={cn('py-2', (i === 0 || i === 6) && 'text-ink-2')}>
            {w}
          </div>
        ))}
      </div>

      {/* 日格 */}
      <div className="grid grid-cols-7">
        {trimmed.map((d, i) => {
          if (!d) return <div key={i} />
          const iso = format(d, 'yyyy-MM-dd')
          const inMonth = d.getMonth() === monthStart.getMonth()
          const day = dayMap.get(iso)
          const isToday = isSameDay(d, new Date())
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          const selected = selectedDate === iso

          const disabled =
            isLoading || !data || !inMonth || !day || day.isClosed || day.availableCount === 0

          return (
            <DayCell
              key={iso}
              iso={iso}
              dayNumber={d.getDate()}
              inMonth={inMonth}
              isToday={isToday}
              isWeekend={isWeekend}
              selected={selected}
              disabled={!!disabled}
              loading={isLoading}
              day={day}
              onClick={() => onSelectDate(iso)}
            />
          )
        })}
      </div>

      {/* 圖例 */}
      <div className="flex flex-wrap items-center gap-4 border-t border-line px-5 py-3 text-xs text-ink-3">
        <Legend swatch="bg-brand-subtle" label="可預約" />
        <Legend swatch="bg-neutral-subtle" label="已滿" />
        <Legend swatch="bg-black" label="公休" />
        <span className="ml-auto">週末以較深底色標示；今日以邊框標示。</span>
      </div>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block size-3 rounded', swatch)} />
      {label}
    </span>
  )
}

interface DayCellProps {
  iso: string
  dayNumber: number
  inMonth: boolean
  isToday: boolean
  isWeekend: boolean
  selected: boolean
  disabled: boolean
  loading: boolean
  day?: DayAvailability
  onClick: () => void
}

function DayCell({
  dayNumber, inMonth, isToday, isWeekend, selected, disabled, loading, day, onClick,
}: DayCellProps) {
  const base = 'relative border-b border-r border-line px-2 py-2 min-h-[80px] text-left transition-colors'
  const state = day?.isClosed
    ? 'bg-black text-white/70 cursor-not-allowed'
    : disabled
    ? 'bg-neutral-subtle text-ink-3 cursor-not-allowed'
    : selected
      ? 'bg-brand-subtle text-brand-subtle-ink ring-2 ring-inset ring-brand'
      : day && day.availableCount > 0
        ? 'bg-surface hover:bg-brand-subtle hover:text-brand-subtle-ink cursor-pointer'
        : 'bg-surface hover:bg-sunken cursor-pointer'

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        base, state,
        !inMonth && 'opacity-40',
        isWeekend && !selected && !disabled && 'bg-sunken/60',
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className={cn('text-sm font-medium', isToday && 'rounded px-1.5 ring-1 ring-brand')}>{dayNumber}</span>
        {loading ? (
          <span className="text-[10px] text-ink-3">…</span>
        ) : day ? (
          day.isClosed ? (
            <span className="text-[10px] text-white/70">公休</span>
          ) : (
            <span className="text-[10px] text-ink-3">{day.availableCount}/{day.totalCount}</span>
          )
        ) : null}
      </div>
      {day && !day.isClosed && day.priceMultiplier && day.priceMultiplier > 1 && (
        <span className="absolute bottom-1 right-1.5 text-[10px] text-warning-subtle-ink">
          假日
        </span>
      )}
    </button>
  )
}
