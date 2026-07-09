/**
 * lib.ts — admin-web 的單例：ApiClient 與 QueryClient。
 * 後台需要登入，getToken 從 localStorage 讀 JWT（登入流程下一輪實作）。
 */
import { QueryClient } from '@tanstack/react-query'
import { createApiClient } from '@studio/shared'

/** localStorage token key，集中定義避免打錯 */
export const TOKEN_KEY = 'studio-admin-token'

export const api = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  getToken: () => localStorage.getItem(TOKEN_KEY),
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})
