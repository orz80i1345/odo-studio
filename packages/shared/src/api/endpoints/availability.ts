/**
 * endpoints/availability.ts
 * 月曆 availability 查詢。
 */
import type { ApiClient } from '../client'
import type { ID, MonthAvailability, DaySlotList } from '../../types'
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

/** 某攝影棚在某月（yyyy-MM）每一天的摘要 */
export async function getMonthAvailability(api: ApiClient, studioId: ID, yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number)
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`
  const res = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 1000,
    filter: [
      filter('studio_id', 'eq', studioId),
      filter('slot_date', 'gte', `${yearMonth}-01`),
      filter('slot_date', 'lt', nextMonth),
    ],
    sort: 'slot_date,start_minute',
  })
  const slots = toScaffoldList(res, toTimeSlot).items
  return monthAvailability(studioId, yearMonth, slots) satisfies MonthAvailability
}

/** 某日詳細時段（點日格後展開清單） */
export async function getDaySlots(api: ApiClient, studioId: ID, date: string) {
  const res = await api.get<ScaffoldListResponse<RawTimeSlot>>('/public/time_slots', {
    pageSize: 200,
    filter: [filter('studio_id', 'eq', studioId), filter('slot_date', 'eq', date)],
    sort: 'start_minute',
  })
  const slots = toScaffoldList(res, toTimeSlot).items.filter((slot) => dateOnly(slot.slotDate) === date)
  return daySlotList(studioId, date, slots) satisfies DaySlotList
}
