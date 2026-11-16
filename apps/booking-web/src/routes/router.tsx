/**
 * router.tsx — booking-web 路由（React Router v7 data router）
 *
 * 結構：
 *   /login, /register              → AuthLayout（沒 header/footer 的左右分欄樣式）
 *   其餘所有頁                     → RootLayout（頂部 nav + 底部 footer）
 *
 * 保護：以下路徑走 ProtectedRoute（未登入 → /login?next=<原路徑>）
 *   /book/:studioId
 *   /book/:studioId/confirm
 *   /bookings/:bookingId/success
 *   /bookings/:bookingId
 *   /my-bookings
 *
 * 命名遵循「動作優先」：
 *   /studios/:slug   看空間  →  /book/:studioId   預約流程
 *   /scenes/:slug    看佈景
 *   /bookings/:id    看訂單
 */
import type { ComponentType } from 'react'
import { Navigate, createBrowserRouter } from 'react-router'
import { RootLayout } from '../layouts/RootLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from '../auth/ProtectedRoute'

/** 每個頁面獨立下載，降低首頁在 LINE 內建瀏覽器中的初始解析量。 */
function lazyPage(load: () => Promise<ComponentType>) {
  return async () => ({ Component: await load() })
}

const homePage = lazyPage(async () => (await import('../pages/HomePage')).HomePage)
const scenesPage = lazyPage(async () => (await import('../pages/ScenesPage')).ScenesPage)
const sceneDetailPage = lazyPage(async () => (await import('../pages/SceneDetailPage')).SceneDetailPage)
const pricingPage = lazyPage(async () => (await import('../pages/PricingPage')).PricingPage)
const equipmentPage = lazyPage(async () => (await import('../pages/EquipmentPage')).EquipmentPage)
const faqPage = lazyPage(async () => (await import('../pages/FAQPage')).FAQPage)
const contactPage = lazyPage(async () => (await import('../pages/ContactPage')).ContactPage)
const privacyPage = lazyPage(async () => (await import('../pages/PrivacyPage')).PrivacyPage)
const termsPage = lazyPage(async () => (await import('../pages/TermsPage')).TermsPage)
const loginPage = lazyPage(async () => (await import('../pages/LoginPage')).LoginPage)
const registerPage = lazyPage(async () => (await import('../pages/RegisterPage')).RegisterPage)
const bookingCalendarPage = lazyPage(async () => (await import('../pages/BookingCalendarPage')).BookingCalendarPage)
const bookingConfirmPage = lazyPage(async () => (await import('../pages/BookingConfirmPage')).BookingConfirmPage)
const bookingSuccessPage = lazyPage(async () => (await import('../pages/BookingSuccessPage')).BookingSuccessPage)
const bookingDetailPage = lazyPage(async () => (await import('../pages/BookingDetailPage')).BookingDetailPage)
const myBookingsPage = lazyPage(async () => (await import('../pages/MyBookingsPage')).MyBookingsPage)
const accountPage = lazyPage(async () => (await import('../pages/AccountPage')).AccountPage)
const lineLinkPage = lazyPage(async () => (await import('../pages/LineLinkPage')).LineLinkPage)
const notFoundPage = lazyPage(async () => (await import('../pages/NotFoundPage')).NotFoundPage)

export const router = createBrowserRouter([
  // ---------- Auth layout（登入 / 註冊） ----------
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', lazy: loginPage },
      { path: '/register', lazy: registerPage },
    ],
  },
  // ---------- Root layout（主站） ----------
  {
    element: <RootLayout />,
    children: [
      // 公開
      { index: true, lazy: homePage },
      { path: '/spaces', lazy: scenesPage },
      { path: '/spaces/:sceneSlug', lazy: sceneDetailPage },
      { path: '/studios',                   element: <Navigate to="/spaces" replace /> },
      { path: '/studios/:studioSlug',       element: <Navigate to="/spaces" replace /> },
      { path: '/scenes',                    element: <Navigate to="/spaces" replace /> },
      { path: '/scenes/:sceneSlug', lazy: sceneDetailPage },
      { path: '/pricing', lazy: pricingPage },
      { path: '/equipment', lazy: equipmentPage },
      { path: '/faq', lazy: faqPage },
      { path: '/contact', lazy: contactPage },
      { path: '/privacy', lazy: privacyPage },
      { path: '/terms', lazy: termsPage },

      // 需登入：預約流程 + 我的預約
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/book/:studioId', lazy: bookingCalendarPage },
          { path: '/book/:studioId/confirm', lazy: bookingConfirmPage },
          { path: '/bookings/:bookingId/success', lazy: bookingSuccessPage },
          { path: '/bookings/:bookingId', lazy: bookingDetailPage },
          { path: '/my-bookings', lazy: myBookingsPage },
          { path: '/account', lazy: accountPage },
          { path: '/line/link', lazy: lineLinkPage },
        ],
      },

      { path: '*', lazy: notFoundPage },
    ],
  },
])
