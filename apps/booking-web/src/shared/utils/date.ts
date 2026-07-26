/**
 * date.ts
 * 日期時間工具，統一使用 date-fns，避免各頁面自行格式化造成不一致。
 */
import { format, parseISO } from 'date-fns'

/** ISO 字串 → '2026/07/03' */
export function formatDate(iso: string): string {
  return format(parseISO(iso), 'yyyy/MM/dd')
}

/** ISO 字串 → '14:00' */
export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

/** 起訖 ISO → '2026/07/03 14:00–16:00'（預約單常用顯示格式） */
export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatDate(startIso)} ${formatTime(startIso)}–${formatTime(endIso)}`
}

/** Date → API 查詢用的 'yyyy-MM-dd' */
export function toDateParam(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
