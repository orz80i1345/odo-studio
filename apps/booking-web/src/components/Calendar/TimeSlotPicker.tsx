/**
 * TimeSlotPicker — 選定日期後的時段挑選。
 * 支援「選一個起點 → 再點一個結束」的區間選取（含首尾）。
 * 若第二次點的比第一次早，就當作重選起點。
 * 中間如果有 booked 就阻擋選取。
 */
import { useMemo, useState } from 'react'
import { Spinner, cn, type ID, type TimeSlot } from '@studio/shared'
import { useDaySlots } from '../../hooks/useAvailability'
import { formatMinuteRange } from '../../utils/time'

interface Props {
  studioId: ID
  date: string
  /** 攝影棚要求的最小預約分鐘 */
  minBookingMinutes: number
  onConfirm: (payload: { startAt: string; endAt: string }) => void
}

export function TimeSlotPicker({ studioId, date, minBookingMinutes, onConfirm }: Props) {
  const { data, isLoading, isError } = useDaySlots(studioId, date)
  const [range, setRange] = useState<{ startIdx: number; endIdx: number } | null>(null)

  const slots = data?.slots ?? []

  const summary = useMemo(() => {
    if (!range || slots.length === 0) return null
    const first = slots[range.startIdx]
    const last = slots[range.endIdx]
    if (!first || !last) return null
    const minutes = last.endMinute - first.startMinute
    const iso = (m: number) => {
      const [y, mo, d] = date.split('-').map(Number)
      const dt = new Date(y, mo - 1, d, Math.floor(m / 60), m % 60)
      return dt.toISOString()
    }
    return {
      startAt: iso(first.startMinute),
      endAt: iso(last.endMinute),
      minutes,
      totalPrice: slots.slice(range.startIdx, range.endIdx + 1)
        .reduce((sum, s) => sum + (s.hourlyPrice ?? 0), 0),
    }
  }, [range, slots, date])

  function toggle(idx: number) {
    const s = slots[idx]
    if (!s || s.status !== 'available') return
    if (!range) return setRange({ startIdx: idx, endIdx: idx })
    // 已有起點
    if (idx < range.startIdx) return setRange({ startIdx: idx, endIdx: idx })
    // 檢查中間全部是 available
    const blocked = slots.slice(range.startIdx, idx + 1).some((x) => x.status !== 'available')
    if (blocked) return setRange({ startIdx: idx, endIdx: idx })
    setRange({ startIdx: range.startIdx, endIdx: idx })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <Spinner /> <span className="ml-2 text-sm text-ink-2">載入時段中…</span>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-danger">
        時段載入失敗。
      </div>
    )
  }
  if (data.isClosed) {
    return (
      <div className="rounded-xl border border-line bg-sunken p-8 text-center text-sm text-ink-2">
        當日公休，請選擇其他日期。
      </div>
    )
  }

  const meetsMin = summary && summary.minutes >= minBookingMinutes

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-serif text-lg text-ink">選擇時段</h3>
        <span className="text-xs text-ink-3">
          點一次選起點，再點一次選結束；最少 {minBookingMinutes / 60} 小時
        </span>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots.map((s, i) => (
          <SlotCell
            key={s.id}
            slot={s}
            selected={!!range && i >= range.startIdx && i <= range.endIdx}
            isEnd={!!range && (i === range.startIdx || i === range.endIdx)}
            onClick={() => toggle(i)}
          />
        ))}
      </ul>

      {/* 摘要 + 確認 */}
      <div className="flex flex-col gap-3 rounded-lg bg-sunken px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {summary ? (
            <>
              <div className="text-ink">
                {formatMinuteRange(slots[range!.startIdx].startMinute, slots[range!.endIdx].endMinute)}
                <span className="ml-2 text-ink-3">（{summary.minutes / 60} 小時）</span>
              </div>
              <div className="mt-0.5 text-ink-2">
                合計 <span className="font-medium text-ink">NT$ {summary.totalPrice.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <span className="text-ink-3">尚未選擇時段</span>
          )}
        </div>
        <button
          type="button"
          disabled={!meetsMin}
          onClick={() => summary && onConfirm({ startAt: summary.startAt, endAt: summary.endAt })}
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors',
            meetsMin
              ? 'bg-brand text-brand-on hover:bg-brand-hover active:bg-brand-active'
              : 'bg-neutral-200 text-ink-3 cursor-not-allowed',
          )}
        >
          下一步：填寫資料
        </button>
      </div>
    </div>
  )
}

function SlotCell({
  slot, selected, isEnd, onClick,
}: { slot: TimeSlot; selected: boolean; isEnd: boolean; onClick: () => void }) {
  const disabled = slot.status !== 'available'
  return (
    <li>
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          'w-full rounded-md border px-2 py-2 text-sm transition-colors',
          disabled && 'bg-neutral-subtle text-ink-3 line-through border-line cursor-not-allowed',
          !disabled && !selected && 'bg-surface text-ink border-line hover:bg-brand-subtle hover:border-brand-subtle-ink hover:text-brand-subtle-ink',
          selected && !isEnd && 'bg-brand-subtle text-brand-subtle-ink border-brand-subtle-ink',
          isEnd && 'bg-brand text-brand-on border-brand',
        )}
      >
        {formatMinuteRange(slot.startMinute, slot.endMinute)}
      </button>
    </li>
  )
}
