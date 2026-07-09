/**
 * AdminLayout.tsx — 後台外框：左側欄導覽 + 右側內容。
 * 骨架階段：純導覽，登入守衛與使用者選單下一輪補。
 */
import { NavLink, Outlet } from 'react-router'
import { CalendarDays, ClipboardList, LayoutDashboard, Settings, Users, Warehouse } from 'lucide-react'
import { cn } from '@studio/shared'

/** 側欄項目集中定義，之後可依角色（owner/staff）過濾 */
const navItems = [
  { to: '/', label: '儀表板', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: '預約管理', icon: ClipboardList },
  { to: '/schedule', label: '檔期日曆', icon: CalendarDays },
  { to: '/studios', label: '攝影棚管理', icon: Warehouse },
  { to: '/customers', label: '顧客', icon: Users },
  { to: '/settings', label: '設定', icon: Settings },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh">
      <aside className="w-56 shrink-0 border-r border-line bg-surface">
        <div className="flex h-14 items-center px-4 font-semibold text-brand">攝影棚後台</div>
        <nav className="space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                  isActive
                    ? 'bg-brand-subtle font-medium text-brand'
                    : 'text-ink-2 hover:bg-sunken',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
