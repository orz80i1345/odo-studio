/**
 * auth/ProtectedRoute.tsx
 * 需要登入的路由 wrapper。
 * 未登入 → 導去 /login?next=<原路徑>
 * 登入成功後 LoginPage 會讀 next 參數把使用者送回原本要去的地方。
 */
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}
