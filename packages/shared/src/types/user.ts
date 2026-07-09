/**
 * user.ts
 * 後台使用者（管理員）型別。前台顧客目前不需登入，資料掛在 Booking 上。
 */
import type { ID } from './common'

export type AdminRole = 'owner' | 'staff'

export interface AdminUser {
  id: ID
  email: string
  displayName: string
  role: AdminRole
}

/** 登入成功回傳 */
export interface AuthSession {
  token: string
  user: AdminUser
}
