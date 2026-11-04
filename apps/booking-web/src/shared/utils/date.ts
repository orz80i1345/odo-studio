/**
 * date.ts
 * 日期時間工具，統一使用 date-fns，避免各頁面自行格式化造成不一致。
 */
import { format, parseISO } from 'date-fns'

const TAIPEI_TIME_ZONE = 'Asia/Taipei'
const TAIPEI_OFFSET_MINUTES = 8 * 60

const taipeiDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TAIPEI_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

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

/** 目前台北日期，格式 yyyy-MM-dd。 */
export function taipeiDateString(date = new Date()): string {
  return taipeiDateTimeParts(date).date
}

/** 判斷 yyyy-MM-dd 是否早於台北今天。 */
export function isPastTaipeiDate(date: string, now = new Date()): boolean {
  return date < taipeiDateString(now)
}

/** 判斷指定台北日期的時段起點是否已經過去。 */
export function isPastTaipeiSlot(date: string, startMinute: number, now = new Date()): boolean {
  const current = taipeiDateTimeParts(now)
  if (date < current.date) return true
  if (date > current.date) return false
  return startMinute <= current.hour * 60 + current.minute
}

/** 將台北牆上時間（yyyy-MM-dd + 當日分鐘）轉成 ISO。 */
export function taipeiDateMinuteToIso(date: string, minute: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match || !Number.isFinite(minute)) throw new Error('日期或時間格式錯誤')
  const [, year, month, day] = match.map(Number)
  const utcMilliseconds = Date.UTC(
    year,
    month - 1,
    day,
    Math.floor(minute / 60),
    minute % 60,
  ) - TAIPEI_OFFSET_MINUTES * 60 * 1000
  return new Date(utcMilliseconds).toISOString()
}

/** ISO 時間是否已到或已過，供確認頁與送出前再次驗證。 */
export function isPastIsoDateTime(value: string, now = new Date()): boolean {
  const time = new Date(value).getTime()
  return !Number.isFinite(time) || time <= now.getTime()
}

function taipeiDateTimeParts(date: Date) {
  const parts = Object.fromEntries(
    taipeiDateTimeFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}
