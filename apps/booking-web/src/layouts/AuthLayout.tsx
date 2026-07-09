/**
 * AuthLayout — 登入 / 註冊頁的極簡框：置中卡片、無 header。
 */
import { Link, Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-canvas md:grid-cols-2">
      {/* 左側品牌／意象 */}
      <aside className="hidden flex-col justify-between bg-brand-subtle p-10 md:flex">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl text-ink">河日</span>
          <span className="text-xs uppercase tracking-[0.2em] text-ink-3">Ode Studio</span>
        </Link>
        <blockquote className="font-serif text-2xl leading-snug text-ink">
          光落下的方式，決定了空間的樣子。
        </blockquote>
        <div className="text-xs text-ink-3">
          預約前請先登入或註冊會員，方便管理你的檔期。
        </div>
      </aside>

      {/* 右側表單 */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
