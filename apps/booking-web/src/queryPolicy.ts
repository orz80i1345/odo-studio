/**
 * 前台查詢快取分級。
 *
 * 這裡只控制瀏覽器記憶體中的 React Query 快取；Redis 仍由後端管理，
 * 前端不會、也不應直接持有 Redis 連線資訊。
 */
const MINUTE = 60_000

/** 空間、佈景、圖片與器材等由後台維護的公開展示資料。 */
export const catalogQueryPolicy = {
  staleTime: 5 * MINUTE,
  gcTime: 30 * MINUTE,
  refetchOnWindowFocus: 'always' as const,
}

/** 價格與匯款帳戶可能由後台臨時調整，保留較短時間。 */
export const configurationQueryPolicy = {
  staleTime: 1 * MINUTE,
  gcTime: 10 * MINUTE,
  refetchOnWindowFocus: 'always' as const,
}

/** 月曆狀態可短暫共用，但回到頁面時仍重新確認。 */
export const availabilityQueryPolicy = {
  staleTime: 30_000,
  gcTime: 5 * MINUTE,
  refetchOnWindowFocus: 'always' as const,
  refetchInterval: 30_000,
  refetchIntervalInBackground: false,
}

/** 單日時段與占用狀態接近即時資料，不做長效快取。 */
export const liveAvailabilityQueryPolicy = {
  staleTime: 5_000,
  gcTime: 1 * MINUTE,
  refetchOnWindowFocus: 'always' as const,
  refetchInterval: 10_000,
  refetchIntervalInBackground: false,
}
