/**
 * availability.ts
 * 月曆 availability 查詢的回傳型別，對應 schema 的 time_slots。
 */
import type { ID, DateString, ISODateTime } from './common'

export type TimeSlotStatus =
  | 'available'
  | 'held'
  | 'booked'
  | 'blocked'
  | 'maintenance'
  | 'holiday'

/** 單一時段：以「分鐘為單位」+ 日期表示 */
export interface TimeSlot {
  id: ID
  studioId: ID
  slotDate: DateString
  startMinute: number
  endMinute: number
  status: TimeSlotStatus
  hourlyPrice?: number
}

/** 月曆用：某日的可用性摘要 */
export interface DayAvailability {
  date: DateString
  /** 該日是否完全公休 */
  isClosed: boolean
  /** 開放的營業區間（供顯示 08:00–22:00 之類） */
  openStartMinute?: number
  openEndMinute?: number
  /** 該日可預約時段數 */
  availableCount: number
  /** 該日總時段數 */
  totalCount: number
  /** 尖峰／假日倍率（>1 時 UI 加標示） */
  priceMultiplier?: number
}

/** 月曆查詢回應：一個攝影棚在某月的全部日子摘要 */
export interface MonthAvailability {
  studioId: ID
  yearMonth: string                         // yyyy-MM
  days: DayAvailability[]
}

/** 單日詳細時段（點擊該日後展開時段清單用） */
export interface DaySlotList {
  studioId: ID
  date: DateString
  isClosed: boolean
  slots: TimeSlot[]
}

/** 前台選擇後、送到確認頁的「預約草稿」（純 URL/local state，未落 DB） */
export interface BookingDraft {
  studioId: ID
  startAt: ISODateTime
  endAt: ISODateTime
  sceneIds?: ID[]
}
