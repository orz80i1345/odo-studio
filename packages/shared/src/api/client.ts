/**
 * client.ts
 * 極簡的 typed fetch 包裝。
 * 設計重點：
 * - shared 不直接讀 import.meta.env，由各 app 以 createApiClient({ baseUrl }) 注入，
 *   避免 shared 綁死於 Vite 環境。
 * - 統一錯誤型別 ApiError，讓 TanStack Query 的 onError 能安全 narrow。
 */

export interface ApiClientOptions {
  /** 例如 http://localhost:3000/api */
  baseUrl: string
  /** 取得 auth token（後台使用）；回傳 null 表示未登入 */
  getToken?: () => string | null
}

/** API 錯誤：帶 HTTP status 與後端錯誤訊息 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiClient {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) => Promise<T>
  post: <T>(path: string, body?: unknown) => Promise<T>
  patch: <T>(path: string, body?: unknown) => Promise<T>
  delete: <T>(path: string) => Promise<T>
}

/** 建立 API client 實例（每個 app 各建一個） */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseUrl, getToken } = options

  /** 核心 request：組 URL、帶 token、統一 JSON 與錯誤處理 */
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(baseUrl.replace(/\/$/, '') + path)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const token = getToken?.()
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!res.ok) {
      // 嘗試讀後端錯誤訊息，失敗則用 statusText
      const message = await res
        .json()
        .then((data: { message?: string }) => data.message ?? res.statusText)
        .catch(() => res.statusText)
      throw new ApiError(res.status, message)
    }

    // 204 No Content 直接回傳 undefined
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  return {
    get: (path, query) => request('GET', path, undefined, query),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
  }
}
