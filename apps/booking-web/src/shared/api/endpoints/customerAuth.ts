/**
 * endpoints/customerAuth.ts
 * 前台會員的登入 / 註冊 / 目前登入者。
 * 後台管理員的 auth 走 endpoints/auth.ts，兩者不共用 token。
 */
import type { ApiClient } from '../client'
import type {
  CustomerAccount,
  CustomerAuthSession,
  LoginInput,
  RegisterInput,
  UpdateCustomerProfileInput,
} from '../../types'
import {
  filter,
  toCustomer,
  toScaffoldList,
  unwrapItem,
  type RawCustomerAccount,
  type ScaffoldItemResponse,
  type ScaffoldListResponse,
} from './scaffold'

interface LoginResponse {
  access_token: string
  refresh_token?: string
}

interface UserResponse {
  id?: number
  email?: string
  account?: string
  phone?: string
  display_name?: string
  displayName?: string
}

export async function customerLogin(api: ApiClient, input: LoginInput) {
  const auth = unwrapItem(await api.post<ScaffoldItemResponse<LoginResponse>>('/auth/login', {
    account: input.email,
    password: input.password,
  }))
  return {
    token: auth.access_token,
    customer: fallbackCustomer(input.email),
  } satisfies CustomerAuthSession
}

export async function customerRegister(api: ApiClient, input: RegisterInput) {
  await api.post('/auth/register', {
    account: input.email,
    password: input.password,
  })

  const auth = unwrapItem(await api.post<ScaffoldItemResponse<LoginResponse>>('/auth/login', {
    account: input.email,
    password: input.password,
  }))
  return { token: auth.access_token, customer: fallbackCustomer(input.email, input.displayName, input.phone) } satisfies CustomerAuthSession
}

export async function getCustomerMe(api: ApiClient) {
  const me = unwrapItem(await api.get<UserResponse | ScaffoldItemResponse<UserResponse>>('/users/me'))
  const email = me.email ?? me.account ?? ''
  return {
    id: me.id ?? 0,
    email,
    phone: me.phone,
    displayName: me.display_name ?? me.displayName ?? email,
    marketingOptIn: false,
    locale: 'zh-TW',
    isActive: true,
    createdAt: '',
    updatedAt: '',
  } satisfies CustomerAccount
}

export async function getCurrentCustomerProfile(api: ApiClient) {
  const me = await getCustomerMe(api)
  const profile = await findCustomerProfileByEmail(api, me.email)
  return profile ?? me
}

export async function ensureCustomerProfile(api: ApiClient, input: RegisterInput) {
  const existing = await findCustomerProfileByEmail(api, input.email)
  if (existing) {
    return updateCustomerProfile(api, existing, {
      displayName: input.displayName,
      phone: input.phone,
      marketingOptIn: input.marketingOptIn,
      locale: existing.locale,
    })
  }

  return createCustomerProfile(api, input.email, {
    displayName: input.displayName,
    phone: input.phone,
    marketingOptIn: input.marketingOptIn,
    locale: 'zh-TW',
  })
}

export async function updateCustomerProfile(
  api: ApiClient,
  current: CustomerAccount,
  input: UpdateCustomerProfileInput,
) {
  const id = current.id || (await findCustomerProfileByEmail(api, current.email))?.id
  if (!id) return createCustomerProfile(api, current.email, input)

  const raw = unwrapItem(await api.patch<RawCustomerAccount | ScaffoldItemResponse<RawCustomerAccount>>(`/public/customer_accounts/${id}`, {
    display_name: input.displayName,
    phone: input.phone,
    marketing_opt_in: input.marketingOptIn ?? false,
    locale: input.locale ?? current.locale ?? 'zh-TW',
    is_active: true,
  }))
  return toCustomer(raw)
}

export function customerLogout(api: ApiClient) {
  return api.post<void>('/auth/logout')
}

async function findCustomerProfileByEmail(api: ApiClient, email: string) {
  if (!email) return null
  const res = await api.get<ScaffoldListResponse<RawCustomerAccount>>('/public/customer_accounts', {
    filters: [filter('email', 'eq', email)],
    pageSize: 1,
  })
  return toScaffoldList(res, toCustomer).items[0] ?? null
}

async function createCustomerProfile(api: ApiClient, email: string, input: UpdateCustomerProfileInput) {
  if (!email) throw new Error('找不到可建立的會員 email')
  const raw = unwrapItem(await api.post<RawCustomerAccount | ScaffoldItemResponse<RawCustomerAccount>>('/public/customer_accounts', {
    email,
    phone: input.phone,
    display_name: input.displayName,
    marketing_opt_in: input.marketingOptIn ?? false,
    locale: input.locale ?? 'zh-TW',
    is_active: true,
  }))
  return toCustomer(raw)
}

function fallbackCustomer(email: string, displayName?: string, phone?: string): CustomerAccount {
  const now = new Date().toISOString()
  return {
    id: 0,
    email,
    phone,
    displayName: displayName ?? email,
    marketingOptIn: false,
    locale: 'zh-TW',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}
