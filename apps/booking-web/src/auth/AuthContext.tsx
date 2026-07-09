/**
 * auth/AuthContext.tsx
 * 前台會員 auth 狀態 + 操作。
 * - 頁面透過 useAuth() 取用
 * - 支援 login / register / logout
 * - 登入成功後自動同步至 localStorage 與 TanStack Query cache
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { customerAuthApi, queryKeys, type CustomerAccount, type LoginInput, type RegisterInput } from '@studio/shared'
import { api } from '../lib'
import { authStorage } from './storage'

interface AuthContextValue {
  user: CustomerAccount | null
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<CustomerAccount | null>(() => authStorage.getUser())

  // 初次載入若有 token 但沒 user，去 /me 撈一次
  useEffect(() => {
    const token = authStorage.getToken()
    if (token && !user) {
      customerAuthApi.getCustomerMe(api).then(
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
    authStorage.setUser(session.customer)
    setUser(session.customer)
    qc.setQueryData(queryKeys.customerAuth.me, session.customer)
  }, [qc])

  const register = useCallback(async (input: RegisterInput) => {
    const session = await customerAuthApi.customerRegister(api, input)
    authStorage.setToken(session.token)
    authStorage.setUser(session.customer)
    setUser(session.customer)
    qc.setQueryData(queryKeys.customerAuth.me, session.customer)
  }, [qc])

  const logout = useCallback(() => {
    customerAuthApi.customerLogout(api).catch(() => {})
    authStorage.clearAll()
    setUser(null)
    qc.clear()
  }, [qc])

  const value = useMemo<AuthContextValue>(() => ({
    user, isAuthenticated: !!user, login, register, logout,
  }), [user, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** 頁面／元件用來取 auth 狀態的 hook */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必須在 <AuthProvider> 內使用')
  return ctx
}
