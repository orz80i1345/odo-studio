/**
 * AuthLayout — 登入 / 註冊頁的極簡框：置中卡片、無 header。
 */
import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="relative grid min-h-screen bg-canvas md:grid-cols-2">
      <Link
        to="/"
        aria-label="返回首頁"
        className="absolute left-5 top-5 z-10 inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface/90 text-ink-2 shadow-quiet transition-colors hover:bg-sunken hover:text-ink md:hidden"
      >
        <ArrowLeft className="size-5" />
      </Link>
      {/* 左側品牌／意象 */}
      <aside className="hidden flex-col justify-between bg-[#F7F1E8] p-10 md:flex">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-2xl text-ink">河日</span>
          <span className="text-xs uppercase tracking-[0.2em] text-ink-3">Ode Studio</span>
        </Link>
        <blockquote className="font-serif text-4xl leading-tight text-ink">
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
