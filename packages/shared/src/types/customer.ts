/**
 * customer.ts
 * 前台會員相關型別，對應 schema 的 customer_accounts。
 */
import type { ID, DateString } from './common'

export interface CustomerAccount {
  id: ID
  email: string
  phone?: string
  displayName?: string
  emailVerifiedAt?: DateString
  phoneVerifiedAt?: DateString
  marketingOptIn: boolean
  locale: string
  isActive: boolean
  createdAt: DateString
  updatedAt: DateString
}

export interface CustomerAuthSession {
  token: string
  customer: CustomerAccount
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  displayName: string
  phone: string
  marketingOptIn?: boolean
}
