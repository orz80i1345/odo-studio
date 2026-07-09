/**
 * endpoints/customerAuth.ts
 * 前台會員的登入 / 註冊 / 目前登入者。
 * 後台管理員的 auth 走 endpoints/auth.ts，兩者不共用 token。
 */
import type { ApiClient } from '../client'
import type { CustomerAccount, CustomerAuthSession, LoginInput, RegisterInput } from '../../types'

export function customerLogin(api: ApiClient, input: LoginInput) {
  return api.post<CustomerAuthSession>('/customer/auth/login', input)
}

export function customerRegister(api: ApiClient, input: RegisterInput) {
  return api.post<CustomerAuthSession>('/customer/auth/register', input)
}

export function getCustomerMe(api: ApiClient) {
  return api.get<CustomerAccount>('/customer/auth/me')
}

export function customerLogout(api: ApiClient) {
  return api.post<void>('/customer/auth/logout')
}
