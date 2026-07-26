/**
 * endpoints/auth.ts
 * 後台管理員登入 / 取得當前使用者。
 */
import type { ApiClient } from '../client'
import type { AdminUser, AuthSession } from '../../types'

/** 管理員登入 */
export function login(api: ApiClient, input: { email: string; password: string }) {
  return api.post<AuthSession>('/auth/login', input)
}

/** 取得目前登入的管理員 */
export function getMe(api: ApiClient) {
  return api.get<AdminUser>('/auth/me')
}
