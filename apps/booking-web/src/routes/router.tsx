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
import { createBrowserRouter } from 'react-router'
import { RootLayout } from '../layouts/RootLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from '../auth/ProtectedRoute'

import { HomePage } from '../pages/HomePage'
import { StudiosPage } from '../pages/StudiosPage'
import { StudioDetailPage } from '../pages/StudioDetailPage'
import { ScenesPage } from '../pages/ScenesPage'
import { SceneDetailPage } from '../pages/SceneDetailPage'
import { PricingPage } from '../pages/PricingPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { BookingCalendarPage } from '../pages/BookingCalendarPage'
import { BookingConfirmPage } from '../pages/BookingConfirmPage'
import { BookingSuccessPage } from '../pages/BookingSuccessPage'
import { BookingDetailPage } from '../pages/BookingDetailPage'
import { MyBookingsPage } from '../pages/MyBookingsPage'
import { FAQPage } from '../pages/FAQPage'
import { ContactPage } from '../pages/ContactPage'
import { PrivacyPage } from '../pages/PrivacyPage'
import { TermsPage } from '../pages/TermsPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export const router = createBrowserRouter([
  // ---------- Auth layout（登入 / 註冊） ----------
  {
    element: <AuthLayout />,
    children: [
      { path: '/login',    element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  // ---------- Root layout（主站） ----------
  {
    element: <RootLayout />,
    children: [
      // 公開
      { index: true,                        element: <HomePage /> },
      { path: '/studios',                   element: <StudiosPage /> },
      { path: '/studios/:studioSlug',       element: <StudioDetailPage /> },
      { path: '/scenes',                    element: <ScenesPage /> },
      { path: '/scenes/:sceneSlug',         element: <SceneDetailPage /> },
      { path: '/pricing',                   element: <PricingPage /> },
      { path: '/faq',                       element: <FAQPage /> },
      { path: '/contact',                   element: <ContactPage /> },
      { path: '/privacy',                   element: <PrivacyPage /> },
      { path: '/terms',                     element: <TermsPage /> },

      // 需登入：預約流程 + 我的預約
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/book/:studioId',                    element: <BookingCalendarPage /> },
          { path: '/book/:studioId/confirm',            element: <BookingConfirmPage /> },
          { path: '/bookings/:bookingId/success',       element: <BookingSuccessPage /> },
          { path: '/bookings/:bookingId',               element: <BookingDetailPage /> },
          { path: '/my-bookings',                       element: <MyBookingsPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
