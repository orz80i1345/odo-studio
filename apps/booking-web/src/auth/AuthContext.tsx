/**
 * auth/AuthContext.tsx
 * 前台會員 auth 狀態 + 操作。
 * - 頁面透過 useAuth() 取用
 * - 支援 login / register / logout
 * - 登入成功後自動同步至 localStorage 與 TanStack Query cache
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  customerAuthApi,
  queryKeys,
  type CustomerAccount,
  type LoginInput,
  type RegisterInput,
  type UpdateCustomerProfileInput,
} from '@studio/shared'
import { api } from '../lib'
import { authStorage } from './storage'

interface AuthContextValue {
  user: CustomerAccount | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  updateProfile: (input: UpdateCustomerProfileInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<CustomerAccount | null>(() => authStorage.getUser())

  // 初次載入若有 token，跟 API 校正目前登入者，避免 localStorage 留著舊資料。
  useEffect(() => {
    const token = authStorage.getToken()
    if (token) {
      customerAuthApi.getCurrentCustomerProfile(api).then(
        (u) => {
          authStorage.setUser(u)
          setUser(u)
        },
        () => authStorage.clearAll(),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const session = await customerAuthApi.customerLogin(api, input)
    authStorage.setToken(session.token)
    const currentUser = await customerAuthApi.getCustomerProfileByEmail(api, input.email)
      .then((profile) => profile ?? session.customer)
      .catch(() => session.customer)
    authStorage.setUser(currentUser)
    setUser(currentUser)
    qc.setQueryData(queryKeys.customerAuth.me, currentUser)
  }, [qc])

  const register = useCallback(async (input: RegisterInput) => {
    const session = await customerAuthApi.customerRegister(api, input)
    authStorage.setToken(session.token)
    const currentUser = await customerAuthApi.ensureCustomerProfile(api, input).catch(async () => (
      customerAuthApi.getCurrentCustomerProfile(api).catch(() => session.customer)
    ))
    authStorage.setUser(currentUser)
    setUser(currentUser)
    qc.setQueryData(queryKeys.customerAuth.me, currentUser)
  }, [qc])

  const updateProfile = useCallback(async (input: UpdateCustomerProfileInput) => {
    if (!user) throw new Error('尚未登入')
    const currentUser = await customerAuthApi.updateCustomerProfile(api, user, input)
    authStorage.setUser(currentUser)
    setUser(currentUser)
    qc.setQueryData(queryKeys.customerAuth.me, currentUser)
  }, [qc, user])

  const logout = useCallback(() => {
    customerAuthApi.customerLogout(api).catch(() => {})
    authStorage.clearAll()
    setUser(null)
    qc.clear()
  }, [qc])

  const value = useMemo<AuthContextValue>(() => ({
    user, isAuthenticated: !!user, login, register, updateProfile, logout,
  }), [user, login, register, updateProfile, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** 頁面／元件用來取 auth 狀態的 hook */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必須在 <AuthProvider> 內使用')
  return ctx
}
