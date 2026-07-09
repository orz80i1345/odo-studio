/**
 * endpoints/customerAuth.ts
 * 前台會員的登入 / 註冊 / 目前登入者。
 * 後台管理員的 auth 走 endpoints/auth.ts，兩者不共用 token。
 */
import type { ApiClient } from '../client'
import type { CustomerAccount, CustomerAuthSession, LoginInput, RegisterInput } from '../../types'
import {
  filter,
  toCustomer,
  unwrapItem,
  unwrapList,
  type RawCustomerAccount,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

interface LoginResponse {
  access_token: string
  refresh_token?: string
}

export async function customerLogin(api: ApiClient, input: LoginInput) {
  const auth = unwrapItem(await api.post<ScaffoldItemResponse<LoginResponse>>('/auth/login', {
    account: input.email,
    password: input.password,
  }))
  const customer = await findCustomerByEmail(api, input.email)
  return {
    token: auth.access_token,
    customer: customer ?? fallbackCustomer(input.email),
  } satisfies CustomerAuthSession
}

export async function customerRegister(api: ApiClient, input: RegisterInput) {
  await api.post('/auth/register', {
    account: input.email,
    password: input.password,
  })

  const existing = await findCustomerByEmail(api, input.email)
  const customer = existing ?? toCustomer(unwrapItem(await api.post<ScaffoldItemResponse<RawCustomerAccount>>('/public/customer_accounts', {
    email: input.email,
    phone: input.phone,
    display_name: input.displayName,
    marketing_opt_in: input.marketingOptIn ?? false,
    locale: 'zh-TW',
    is_active: true,
  })))

  const auth = unwrapItem(await api.post<ScaffoldItemResponse<LoginResponse>>('/auth/login', {
    account: input.email,
    password: input.password,
  }))
  return { token: auth.access_token, customer } satisfies CustomerAuthSession
}

export async function getCustomerMe(api: ApiClient) {
  return api.get<CustomerAccount>('/auth/me')
}

export function customerLogout(api: ApiClient) {
  return api.post<void>('/auth/logout')
}

async function findCustomerByEmail(api: ApiClient, email: string) {
  const res = await api.get<ScaffoldListResponse<RawCustomerAccount>>('/public/customer_accounts', {
    pageSize: 1,
    filter: [filter('email', 'eq', email), filter('is_active', 'eq', true)],
  })
  const raw = unwrapList(res).items[0]
  return raw ? toCustomer(raw) : null
}

function fallbackCustomer(email: string): CustomerAccount {
  const now = new Date().toISOString()
  return {
    id: 0,
    email,
    marketingOptIn: false,
    locale: 'zh-TW',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}
