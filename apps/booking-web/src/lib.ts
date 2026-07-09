/**
 * lib.ts
 * booking-web 專用的共享單例：ApiClient、QueryClient。
 * ApiClient 會：
 *  - 帶上 customer auth token（若已登入）
 *  - 在 VITE_USE_MOCK=true 或未設 VITE_API_BASE_URL 時，改走 mock/handlers
 */
import { QueryClient } from '@tanstack/react-query'
import { createApiClient, ApiError, type ApiQuery } from '@studio/shared'
import { authStorage } from './auth/storage'
import { handleMock, MockHttpError } from './mock/handlers'

const useMock =
  import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_BASE_URL

/** 真實 ApiClient：從環境變數讀 baseUrl，token 由 authStorage 動態提供 */
const realApi = createApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  getToken: () => authStorage.getToken(),
  apiKey: import.meta.env.VITE_API_KEY,
})

/** Mock ApiClient：與 realApi 同介面，但走 handlers 而非 fetch */
const mockApi = {
  get: <T,>(path: string, query?: ApiQuery) => call<T>('GET', path, undefined, query),
  post: <T,>(path: string, body?: unknown) => call<T>('POST', path, body),
  patch: <T,>(path: string, body?: unknown) => call<T>('PATCH', path, body),
  delete: <T,>(path: string) => call<T>('DELETE', path),
}

async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  query?: ApiQuery,
): Promise<T> {
  const q = query
    ? '?' + new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map((item) => [k, String(item)])),
      ).toString()
    : ''
  try {
    return (await handleMock(method, path + q, body)) as T
  } catch (e) {
    if (e instanceof MockHttpError) throw new ApiError(e.status, e.message)
    throw e
  }
}

export const api = useMock ? mockApi : realApi

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
