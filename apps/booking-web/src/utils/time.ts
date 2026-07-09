/** 把「一天中的分鐘」格式化為 HH:mm */
export function formatMinute(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** HH:mm–HH:mm */
export function formatMinuteRange(start: number, end: number): string {
  return `${formatMinute(start)}–${formatMinute(end)}`
}
