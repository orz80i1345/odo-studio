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
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/60 backdrop-blur-md">
        <div className="relative flex h-20 w-full items-center justify-between px-5 md:px-10">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="font-serif text-2xl leading-none text-ink">河日</span>
            <span className="text-[11px] uppercase tracking-[0.36em] text-ink-3">Ode Studio</span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 text-[11px] uppercase tracking-[0.24em] md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('text-ink-2 transition-colors duration-500 hover:text-ink', isActive && 'text-ink')
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
                  to="/account"
                  className="hidden items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-ink-2 transition-colors duration-500 hover:text-ink sm:inline-flex"
                >
                  <User className="size-4" />
                  {user?.displayName ?? '我的'}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-ink-3 transition-colors duration-500 hover:text-ink-2"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">登出</span>
                </button>
              </>
            ) : (
              <Link
                to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-ink-2 transition-colors duration-500 hover:text-ink"
              >
                <LogIn className="size-4" />
                登入
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* content */}
      <main className="mx-auto w-full max-w-7xl grow px-5 py-14 md:px-10 md:py-20">
        <Outlet />
      </main>

      {/* footer */}
      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 text-sm md:grid-cols-[1.4fr_1fr_1fr] md:px-10 md:py-24">
          <div>
            <div className="font-serif text-4xl leading-none text-ink">河日</div>
            <p className="mt-6 max-w-sm leading-7 text-ink-2">
              位於淡水河岸邊的公寓攝影棚，白日自然光、生活感佈景。
            </p>
          </div>
          <div>
            <div className="mb-5 text-[11px] uppercase tracking-[0.28em] text-ink-3">Space</div>
            <ul className="space-y-3 text-ink-2">
              <li><Link to="/studios" className="hover:text-ink">空間介紹</Link></li>
              <li><Link to="/scenes" className="hover:text-ink">佈景展示</Link></li>
              <li><Link to="/pricing" className="hover:text-ink">價格</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-5 text-[11px] uppercase tracking-[0.28em] text-ink-3">Info</div>
            <ul className="space-y-3 text-ink-2">
              <li><Link to="/faq" className="hover:text-ink">常見問題</Link></li>
              <li><Link to="/contact" className="hover:text-ink">聯絡資訊</Link></li>
              <li><Link to="/privacy" className="hover:text-ink">隱私權政策</Link></li>
              <li><Link to="/terms" className="hover:text-ink">使用條款</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line/70 py-5 text-center text-[11px] uppercase tracking-[0.22em] text-ink-3">
          © {new Date().getFullYear()} 河日 Ode Studio.
        </div>
      </footer>
    </div>
  )
}
