/**
 * endpoints/availability.ts
 * 月曆 availability 查詢。
 */
import type { ApiClient } from '../client'
import type { ID, MonthAvailability, DayAvailability, DaySlotList } from '../../types'
import {
  dateOnly,
  daySlotList,
  filter,
  monthAvailability,
  toScaffoldList,
  toTimeSlot,
  type RawTimeSlot,
  type ScaffoldListResponse,
} from './scaffold'

interface RawStudioDailyAvailability {
  id: ID
  studio_id: ID
  availability_date: string
  total_count?: number
  available_count?: number
  held_count?: number
  booked_count?: number
  blocked_count?: number
  maintenance_count?: number
  holiday_count?: number
  is_closed?: boolean
  open_start_minute?: number | null
  open_end_minute?: number | null
  min_hourly_price?: number | string | null
}

/** 某攝影棚在某月（yyyy-MM）每一天的摘要 */
export async function getMonthAvailability(api: ApiClient, studioId: ID, yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = `${yearMonth}-01`
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
  const summary = await listDailyAvailability(api, studioId, monthStart, nextMonth)
  if (summary.length > 0) return monthAvailabilityFromSummary(studioId, yearMonth, summary)

  const slots = await listAllTimeSlots(api, {
    filter: [
      filter('studio_id', 'eq', studioId),
      filter('slot_date', 'gte', toApiDateTime(monthStart)),
      filter('slot_date', 'lt', toApiDateTime(nextMonth)),
    ],
    sort: 'slot_date,start_minute',
  })
  return monthAvailability(studioId, yearMonth, slots) satisfies MonthAvailability
}

/** 某日詳細時段（點日格後展開清單） */
export async function getDaySlots(api: ApiClient, studioId: ID, date: string) {
  const res = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 100,
    filter: [filter('studio_id', 'eq', studioId), filter('slot_date', 'eq', toApiDateTime(date))],
    sort: 'start_minute',
  })
  const slots = toScaffoldList(res, toTimeSlot).items.filter((slot) => dateOnly(slot.slotDate) === date)
  return daySlotList(studioId, date, slots) satisfies DaySlotList
}

function toApiDateTime(date: string): string {
  return `${date}T00:00:00Z`
}

async function listDailyAvailability(api: ApiClient, studioId: ID, from: string, to: string) {
  const res = await api.get<ScaffoldListResponse<RawStudioDailyAvailability>>('/public/studio_daily_availability', {
    pageSize: 100,
    filter: [
      filter('studio_id', 'eq', studioId),
      filter('availability_date', 'gte', toApiDateTime(from)),
      filter('availability_date', 'lt', toApiDateTime(to)),
    ],
    sort: 'availability_date',
  })
  return toScaffoldList(res, (item) => item).items
}

function monthAvailabilityFromSummary(
  studioId: ID,
  yearMonth: string,
  summary: RawStudioDailyAvailability[],
): MonthAvailability {
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const summaryByDate = new Map(summary.map((item) => [dateOnly(item.availability_date), item]))
  const days: DayAvailability[] = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${yearMonth}-${String(i + 1).padStart(2, '0')}`
    const item = summaryByDate.get(date)
    return {
      date,
      isClosed: item?.is_closed ?? true,
      openStartMinute: item?.open_start_minute ?? undefined,
      openEndMinute: item?.open_end_minute ?? undefined,
      availableCount: item?.available_count ?? 0,
      totalCount: item?.total_count ?? 0,
      priceMultiplier: undefined,
    }
  })
  return { studioId, yearMonth, days }
}

async function listAllTimeSlots(
  api: ApiClient,
  query: { filter: string[]; sort: string },
) {
  const pageSize = 100
  const items = []
  for (let page = 1; ; page += 1) {
    const res = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
      page,
      pageSize,
      filter: query.filter,
      sort: query.sort,
    })
    const current = toScaffoldList(res, toTimeSlot)
    items.push(...current.items)
    if (items.length >= current.total || current.items.length === 0) break
  }
  return items
}
