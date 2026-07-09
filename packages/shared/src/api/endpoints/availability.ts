/**
 * endpoints/availability.ts
 * 月曆 availability 查詢。
 */
import type { ApiClient } from '../client'
import type { ID, MonthAvailability, DaySlotList } from '../../types'

/** 某攝影棚在某月（yyyy-MM）每一天的摘要 */
export function getMonthAvailability(api: ApiClient, studioId: ID, yearMonth: string) {
  return api.get<MonthAvailability>(`/studios/${studioId}/availability`, { month: yearMonth })
}

/** 某日詳細時段（點日格後展開清單） */
export function getDaySlots(api: ApiClient, studioId: ID, date: string) {
  return api.get<DaySlotList>(`/studios/${studioId}/slots`, { date })
}
