/**
 * RootLayout — 前台外殼：header + 內容 + footer。
 * header 顯示品牌識別、導覽、登入／我的預約入口。
 */
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { LogIn, LogOut, User } from 'lucide-react'
import { cn } from '@studio/shared'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { to: '/studios', label: '空間' },
  { to: '/scenes', label: '佈景' },
  { to: '/pricing', label: '價格' },
  { to: '/faq', label: 'FAQ' },
]

export function RootLayout() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* header */}
      <header className="border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-serif text-xl text-ink">河日</span>
            <span className="text-xs uppercase tracking-[0.2em] text-ink-3">Ode Studio</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('text-ink-2 hover:text-ink', isActive && 'text-ink')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/my-bookings"
                  className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-2 hover:bg-sunken hover:text-ink sm:inline-flex"
                >
                  <User className="size-4" />
                  {user?.displayName ?? '我的'}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-3 hover:bg-sunken hover:text-ink-2"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">登出</span>
                </button>
              </>
            ) : (
              <Link
                to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-2 hover:bg-sunken hover:text-ink"
              >
                <LogIn className="size-4" />
                登入
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* content */}
      <main className="mx-auto w-full max-w-6xl grow px-6 py-10 md:py-14">
        <Outlet />
      </main>

      {/* footer */}
      <footer className="border-t border-line bg-sunken/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm md:grid-cols-3">
          <div>
            <div className="font-serif text-lg text-ink">河日 Ode Studio</div>
            <p className="mt-2 text-ink-3">
              位於淡水河岸邊的公寓攝影棚，白日自然光、生活感佈景。
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-3">場地</div>
            <ul className="space-y-1.5 text-ink-2">
              <li><Link to="/studios" className="hover:text-ink">空間介紹</Link></li>
              <li><Link to="/scenes" className="hover:text-ink">佈景展示</Link></li>
              <li><Link to="/pricing" className="hover:text-ink">價格方案</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-ink-3">資訊</div>
            <ul className="space-y-1.5 text-ink-2">
              <li><Link to="/faq" className="hover:text-ink">常見問題</Link></li>
              <li><Link to="/contact" className="hover:text-ink">聯絡資訊</Link></li>
              <li><Link to="/privacy" className="hover:text-ink">隱私權政策</Link></li>
              <li><Link to="/terms" className="hover:text-ink">使用條款</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line/70 py-4 text-center text-xs text-ink-3">
          © {new Date().getFullYear()} 河日 Ode Studio.
        </div>
      </footer>
    </div>
  )
}
