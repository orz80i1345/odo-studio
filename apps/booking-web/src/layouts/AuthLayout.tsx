/**
 * AuthLayout — 登入 / 註冊頁的極簡框：置中卡片、無 header。
 */
import { ArrowLeft } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { BrandLogo } from '../components/ui/BrandLogo'

export function AuthLayout() {
  return (
    <div className="relative grid min-h-screen bg-canvas md:grid-cols-2">
      <Link
        to="/"
        aria-label="返回首頁"
        className="absolute left-5 top-5 z-10 inline-flex size-10 items-center justify-center bg-transparent text-ink-2 transition duration-200 hover:-translate-x-0.5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:hidden"
      >
        <ArrowLeft className="size-5" />
      </Link>
      {/* 左側品牌／意象 */}
      <aside className="hidden flex-col justify-between bg-[#F7F1E8] p-10 md:flex">
        <Link to="/" aria-label="河日 Ode Studio 首頁" className="inline-flex w-fit items-center">
          <BrandLogo variant="full" className="w-36" />
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
