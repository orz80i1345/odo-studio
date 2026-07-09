/**
 * auth/storage.ts
 * 顧客 auth token / user 的 localStorage 存取。
 * 用獨立 key（customer_ 前綴）避免與後台的 admin token 混淆。
 */
import type { CustomerAccount } from '@studio/shared'

const TOKEN_KEY = 'ode:customer:token'
const USER_KEY = 'ode:customer:user'

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
  getUser(): CustomerAccount | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as CustomerAccount
    } catch {
      return null
    }
  },
  setUser(user: CustomerAccount): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearUser(): void {
    localStorage.removeItem(USER_KEY)
  },
  clearAll(): void {
    this.clearToken()
    this.clearUser()
  },
}
