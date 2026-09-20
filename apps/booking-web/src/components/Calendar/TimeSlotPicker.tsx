/**
 * TimeSlotPicker — 選定日期後的時段挑選。
 * 支援「選一個起點 → 再點一個結束」的區間選取（含首尾）。
 * 若第二次點的比第一次早，就當作重選起點。
 * 中間如果有 booked 就阻擋選取。
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spinner, cn, type ID, type TimeSlot } from '@studio/shared'
import { useDaySlots } from '../../hooks/useAvailability'
import { formatMinuteRange } from '../../utils/time'
import { api } from '../../lib'
import type { Scene, ScenePrice } from '@studio/shared'

interface Props {
  studioId: ID
  date: string
  /** 攝影棚要求的最小預約分鐘 */
  minBookingMinutes: number
  scenes: Scene[]
  scenePrices: ScenePrice[]
  buyoutHourlyPrice?: number
  fallbackHourlyPrice: number
  selectedSceneIds: ID[]
  onChangeSelectedSceneIds: (sceneIds: ID[]) => void
  forceBuyout: boolean
  onChangeForceBuyout: (value: boolean) => void
  onConfirm: (payload: { startAt: string; endAt: string; sceneIds: ID[]; bookingMode: 'scenes' | 'buyout' }) => void
}

interface RawBookingSceneTimeSlot {
  id: ID
  booking_id: ID
  scene_id: ID
  time_slot_id: ID
}

export function TimeSlotPicker({
  studioId,
  date,
  minBookingMinutes,
  scenes,
  scenePrices,
  buyoutHourlyPrice,
  fallbackHourlyPrice,
  selectedSceneIds,
  onChangeSelectedSceneIds,
  forceBuyout,
  onChangeForceBuyout,
  onConfirm,
}: Props) {
  const { data, isLoading, isError } = useDaySlots(studioId, date)
  const [range, setRange] = useState<{ startIdx: number; endIdx: number } | null>(null)

  const slots = data?.slots ?? []
  const priceBySceneId = useMemo(
    () => new Map(scenePrices.map((price) => [price.sceneId, price.hourlyPrice])),
    [scenePrices],
  )
  const occupiedQuery = useQuery({
    queryKey: ['booking-scene-time-slots', studioId, date, slots.map((slot) => slot.id).join(',')],
    queryFn: async () => {
      const res = await api.get<{ data: RawBookingSceneTimeSlot[] }>('/booking_scene_time_slots', {
        pageSize: 300,
        filter: [
          `time_slot_id,in,${slots.map((slot) => slot.id).join(',')}`,
          'status,eq,active',
        ],
      })
      return res.data ?? []
    },
    enabled: slots.length > 0,
    staleTime: 10_000,
  })
  const occupiedSceneIdsBySlotId = useMemo(() => {
    const map = new Map<ID, Set<ID>>()
    for (const item of occupiedQuery.data ?? []) {
      const set = map.get(item.time_slot_id) ?? new Set<ID>()
      set.add(item.scene_id)
      map.set(item.time_slot_id, set)
    }
    return map
  }, [occupiedQuery.data])

  const bookingMode = forceBuyout || selectedSceneIds.length >= 2 ? 'buyout' : 'scenes'
  const effectiveSceneIds = bookingMode === 'buyout' ? scenes.map((scene) => scene.id) : selectedSceneIds

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
    const selectedSlots = slots.slice(range.startIdx, range.endIdx + 1)
    const hourlyPrice = bookingMode === 'buyout'
      ? buyoutHourlyPrice ?? fallbackHourlyPrice
      : selectedSceneIds.reduce((sum, sceneId) => sum + (priceBySceneId.get(sceneId) ?? fallbackHourlyPrice), 0)
    const unavailableSceneIds = effectiveSceneIds.filter((sceneId) =>
      selectedSlots.some((slot) => occupiedSceneIdsBySlotId.get(slot.id)?.has(sceneId)))
    return {
      startAt: iso(first.startMinute),
      endAt: iso(last.endMinute),
      minutes,
      hourlyPrice,
      unavailableSceneIds,
      totalPrice: Math.round(hourlyPrice * (minutes / 60)),
    }
  }, [bookingMode, buyoutHourlyPrice, date, effectiveSceneIds, fallbackHourlyPrice, occupiedSceneIdsBySlotId, priceBySceneId, range, selectedSceneIds, slots])

  const sceneAvailability = useMemo(() => {
    const selectedSlots = range ? slots.slice(range.startIdx, range.endIdx + 1) : []
    return scenes.map((scene) => {
      const unavailable = selectedSlots.length > 0 && selectedSlots.some((slot) => occupiedSceneIdsBySlotId.get(slot.id)?.has(scene.id))
      return { scene, unavailable }
    })
  }, [occupiedSceneIdsBySlotId, range, scenes, slots])

  function toggleScene(sceneId: ID) {
    onChangeForceBuyout(false)
    onChangeSelectedSceneIds(selectedSceneIds.includes(sceneId)
      ? selectedSceneIds.filter((id) => id !== sceneId)
      : [...selectedSceneIds, sceneId])
  }

  function toggle(idx: number) {
    const s = slots[idx]
    if (!s || s.status !== 'available') return
    if (!range) return setRange({ startIdx: idx, endIdx: idx })
    // 已經選出一段區間後，再點任何可用時段都視為重新選起點。
    if (range.endIdx > range.startIdx) return setRange({ startIdx: idx, endIdx: idx })
    // 已有起點
    if (idx < range.startIdx) return setRange({ startIdx: idx, endIdx: idx })
    // 檢查中間全部是 available
    const blocked = slots.slice(range.startIdx, idx + 1).some((x) => x.status !== 'available')
    if (blocked) return setRange({ startIdx: idx, endIdx: idx })
    setRange({ startIdx: range.startIdx, endIdx: idx })
  }

  function selectStart(value: string) {
    if (!value) return setRange(null)
    const idx = Number(value)
    const slot = slots[idx]
    if (!slot || slot.status !== 'available') return
    setRange({ startIdx: idx, endIdx: idx })
  }

  function selectEnd(value: string) {
    if (!range || !value) return
    const idx = Number(value)
    const blocked = slots.slice(range.startIdx, idx + 1).some((slot) => slot.status !== 'available')
    if (idx < range.startIdx || blocked) return
    setRange({ startIdx: range.startIdx, endIdx: idx })
  }

  const startOptions = slots
    .map((slot, idx) => ({ slot, idx }))
    .filter(({ slot }) => slot.status === 'available')
  const endOptions = range
    ? slots
      .map((slot, idx) => ({ slot, idx }))
      .filter(({ slot, idx }) => {
        if (idx < range.startIdx || slot.status !== 'available') return false
        return !slots.slice(range.startIdx, idx + 1).some((item) => item.status !== 'available')
      })
    : []

  if (isLoading || occupiedQuery.isLoading) {
    return (
      <div className="border-y border-line py-10 text-center">
        <Spinner /> <span className="ml-2 text-sm text-ink-2">載入時段中…</span>
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="border-y border-line py-10 text-center text-sm text-danger">
        時段載入失敗。
      </div>
    )
  }
  if (data.isClosed) {
    return (
      <div className="border-y border-line bg-neutral-subtle py-10 text-center text-sm text-ink-3">
        當日公休，請選擇其他日期。
      </div>
    )
  }

  const buyoutUnavailable = effectiveSceneIds.length > 0 && summary
    ? summary.unavailableSceneIds.length > 0
    : false
  const hasSelection = effectiveSceneIds.length > 0
  const meetsMin = summary && summary.minutes >= minBookingMinutes && hasSelection && !buyoutUnavailable

  return (
    <div className="space-y-8 border-y border-line py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
        <h3 className="font-serif text-4xl text-ink">選擇時段</h3>
        <span className="text-xs text-ink-3">
          手機可直接選開始與結束；最少 {minBookingMinutes / 60} 小時
        </span>
      </div>

      <div className="grid gap-4 sm:hidden">
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-ink-3">Start</span>
          <select
            value={range?.startIdx ?? ''}
            onChange={(event) => selectStart(event.target.value)}
            className="h-14 w-full border border-line bg-canvas px-4 text-lg text-ink outline-none focus:border-ink"
          >
            <option value="">選擇開始時間</option>
            {startOptions.map(({ slot, idx }) => (
              <option key={slot.id} value={idx}>
                {formatMinuteRange(slot.startMinute, slot.endMinute).split('–')[0]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-ink-3">End</span>
          <select
            value={range?.endIdx ?? ''}
            onChange={(event) => selectEnd(event.target.value)}
            disabled={!range}
            className="h-14 w-full border border-line bg-canvas px-4 text-lg text-ink outline-none focus:border-ink disabled:text-ink-3"
          >
            <option value="">選擇結束時間</option>
            {endOptions.map(({ slot, idx }) => (
              <option key={slot.id} value={idx}>
                {formatMinuteRange(slot.startMinute, slot.endMinute).split('–')[1]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="hidden gap-px border border-line bg-line sm:grid sm:grid-cols-4 md:grid-cols-6">
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

      <section className="space-y-4 border-t border-line pt-8">
        <h4 className="font-serif text-3xl text-ink">選擇空間</h4>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {sceneAvailability.map(({ scene, unavailable }) => {
            const selected = effectiveSceneIds.includes(scene.id)
            const disabled = unavailable || forceBuyout
            return (
              <button
                key={scene.id}
                type="button"
                disabled={disabled}
                onClick={() => toggleScene(scene.id)}
                className={cn(
                  'min-h-20 border-0 px-4 py-3 text-left text-sm transition-colors duration-500',
                  selected && !unavailable && 'bg-brand-subtle text-brand-subtle-ink',
                  !selected && !unavailable && 'bg-canvas text-ink hover:bg-surface',
                  unavailable && 'cursor-not-allowed bg-neutral-subtle text-ink-3 line-through',
                  disabled && !unavailable && 'cursor-not-allowed opacity-70',
                )}
              >
                <span className="block font-medium">{scene.name}</span>
                <span className="mt-0.5 block text-xs opacity-75">
                  {unavailable ? '此時段已被預約' : `NT$ ${(priceBySceneId.get(scene.id) ?? fallbackHourlyPrice).toLocaleString()}/hr`}
                </span>
              </button>
            )
          })}
        </div>
        {selectedSceneIds.length >= 2 && !forceBuyout && (
          <p className="text-xs text-ink-3">選擇 2 個以上空間會自動以包場價格計算，並保留所有空間。</p>
        )}
      </section>

      {/* 摘要 + 確認 */}
      <div className="flex flex-col gap-5 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {summary ? (
            <>
              <div className="text-ink">
                {formatMinuteRange(slots[range!.startIdx].startMinute, slots[range!.endIdx].endMinute)}
                <span className="ml-2 text-ink-3">（{summary.minutes / 60} 小時）</span>
              </div>
              <div className="mt-0.5 text-ink-2">
                {bookingMode === 'buyout' ? '包場' : '單一空間'} · NT$ {summary.hourlyPrice.toLocaleString()}/hr
                <span className="ml-2 font-medium text-ink">合計 NT$ {summary.totalPrice.toLocaleString()}</span>
              </div>
              {buyoutUnavailable && (
                <div className="mt-0.5 text-danger">所選區間已有空間被預約，無法包場。</div>
              )}
            </>
          ) : (
            <span className="text-ink-3">尚未選擇時段</span>
          )}
        </div>
        <button
          type="button"
          disabled={!meetsMin}
          onClick={() => summary && onConfirm({ startAt: summary.startAt, endAt: summary.endAt, sceneIds: effectiveSceneIds, bookingMode })}
          className={cn(
            'inline-flex h-11 items-center justify-center border px-5 text-xs uppercase tracking-[0.18em] transition-colors duration-500',
            meetsMin
              ? 'border-ink bg-transparent text-ink hover:bg-ink hover:text-ink-on'
              : 'cursor-not-allowed border-line bg-transparent text-ink-3',
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
          'w-full border-0 px-4 py-4 text-left text-base transition-colors duration-500 sm:px-2 sm:py-3 sm:text-center sm:text-sm',
          disabled && 'cursor-not-allowed bg-neutral-subtle text-ink-3 line-through',
          !disabled && !selected && 'bg-canvas text-ink hover:bg-surface',
          selected && !isEnd && 'bg-brand-subtle text-brand-subtle-ink',
          isEnd && 'bg-brand text-brand-on',
        )}
      >
        {formatMinuteRange(slot.startMinute, slot.endMinute)}
      </button>
    </li>
  )
}
