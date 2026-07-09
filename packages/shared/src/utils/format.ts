/**
 * format.ts
 * 顯示用格式化工具（金額等）。
 */

/** 整數元 → 'NT$1,200' */
export function formatTwd(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount)
}
