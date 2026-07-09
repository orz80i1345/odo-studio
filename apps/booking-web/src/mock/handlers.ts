/**
 * mock/handlers.ts
 * 在無後端時，攔截 ApiClient 的 fetch 並回傳 mock 資料。
 * 啟用方式：VITE_USE_MOCK=true（見 .env.example）或不設 VITE_API_BASE_URL。
 */
import type { Booking, BookingSource, CreateBookingInput, CustomerAuthSession, ID, LoginInput, RegisterInput } from '@studio/shared'
import {
  buildDaySlots, buildMonthAvailability,
  mockBankAccounts, mockBookings, mockCustomer,
  mockPricingPlans, mockScenes, mockStudios,
} from './data'

const wait = (ms = 200) => new Promise((r) => setTimeout(r, ms))

let bookingSeq = 900

function nextBookingNumber(): string {
  bookingSeq += 1
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `ODE-${ymd}-${String(bookingSeq).padStart(4, '0')}`
}

function pickStudio(id: ID) {
  return mockStudios.find((s) => s.id === id) ?? mockStudios[0]
}

/** 主入口：由 method + path 分派到對應的 handler，回傳 JSON 物件 */
export async function handleMock(method: string, path: string, body?: unknown): Promise<unknown> {
  await wait()
  const [pathname, search = ''] = path.split('?')
  const query = Object.fromEntries(new URLSearchParams(search))
  const m = (pattern: string) => matchRoute(pattern, pathname)

  // ---------------- 顧客 auth ----------------
  if (method === 'POST' && pathname === '/customer/auth/login') {
    const input = body as LoginInput
    const session: CustomerAuthSession = {
      token: 'mock-token-' + Math.random().toString(36).slice(2),
      customer: { ...mockCustomer, email: input.email || mockCustomer.email },
    }
    return session
  }
  if (method === 'POST' && pathname === '/customer/auth/register') {
    const input = body as RegisterInput
    const session: CustomerAuthSession = {
      token: 'mock-token-' + Math.random().toString(36).slice(2),
      customer: {
        ...mockCustomer,
        email: input.email,
        phone: input.phone,
        displayName: input.displayName,
      },
    }
    return session
  }
  if (method === 'GET' && pathname === '/customer/auth/me') {
    return mockCustomer
  }
  if (method === 'POST' && pathname === '/customer/auth/logout') {
    return undefined
  }

  // ---------------- 攝影棚 ----------------
  if (method === 'GET' && pathname === '/studios') {
    return { items: mockStudios, page: 1, pageSize: 20, total: mockStudios.length }
  }
  {
    const p = m('/studios/:key')
    if (method === 'GET' && p) {
      const key = p.key
      const found = mockStudios.find((s) => String(s.id) === key || s.slug === key)
      if (!found) throw new HttpError(404, '找不到攝影棚')
      return found
    }
  }

  // ---------------- 佈景 ----------------
  if (method === 'GET' && pathname === '/scenes') {
    const items = query.studioId
      ? mockScenes.filter((s) => s.studioId === Number(query.studioId))
      : mockScenes
    return { items, page: 1, pageSize: 50, total: items.length }
  }
  {
    const p = m('/scenes/:key')
    if (method === 'GET' && p) {
      const key = p.key
      const found = mockScenes.find((s) => String(s.id) === key || s.slug === key)
      if (!found) throw new HttpError(404, '找不到佈景')
      return found
    }
  }

  // ---------------- 定價 ----------------
  if (method === 'GET' && pathname === '/pricing-plans') {
    const list = query.studioId
      ? mockPricingPlans.filter((p) => p.studioId === Number(query.studioId))
      : mockPricingPlans
    return list
  }

  // ---------------- availability ----------------
  {
    const p = m('/studios/:sid/availability')
    if (method === 'GET' && p) {
      const month = query.month || new Date().toISOString().slice(0, 7)
      return buildMonthAvailability(Number(p.sid), month)
    }
  }
  {
    const p = m('/studios/:sid/slots')
    if (method === 'GET' && p) {
      const date = query.date || new Date().toISOString().slice(0, 10)
      return buildDaySlots(Number(p.sid), date)
    }
  }

  // ---------------- 銀行帳戶 ----------------
  if (method === 'GET' && pathname === '/bank-accounts') return mockBankAccounts

  // ---------------- bookings ----------------
  if (method === 'POST' && pathname === '/bookings') {
    const input = body as CreateBookingInput
    const studio = pickStudio(input.studioId)
    const startAt = new Date(input.startAt)
    const endAt = new Date(input.endAt)
    const hours = Math.round(((+endAt - +startAt) / 3_600_000) * 100) / 100
    const dow = startAt.getDay()
    const hourlyPrice = dow === 0 || dow === 6 ? 1600 : studio.defaultHourlyPrice
    const subtotal = Math.round(hourlyPrice * hours)
    const now = new Date().toISOString()
    const booking: Booking = {
      id: bookingSeq + 1,
      bookingNumber: nextBookingNumber(),
      studioId: input.studioId,
      customerAccountId: mockCustomer.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      startAt: input.startAt,
      endAt: input.endAt,
      totalHours: hours,
      headcount: input.headcount,
      purpose: input.purpose,
      sceneIds: input.sceneIds ?? [],
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      totalPrice: subtotal,
      depositAmount: Math.round(subtotal * 0.3),
      status: 'pending',
      paymentStatus: 'unpaid',
      customerNote: input.customerNote,
      source: 'web' as BookingSource,
      createdAt: now,
      updatedAt: now,
    }
    mockBookings.unshift(booking)
    return booking
  }

  if (method === 'GET' && pathname === '/my/bookings') {
    return { items: mockBookings, page: 1, pageSize: 20, total: mockBookings.length }
  }
  {
    const p = m('/bookings/:bid/cancel')
    if (method === 'POST' && p) {
      const idx = mockBookings.findIndex((b) => b.id === Number(p.bid))
      if (idx < 0) throw new HttpError(404, '找不到預約')
      const b = mockBookings[idx]
      const updated: Booking = {
        ...b,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: (body as { reason?: string })?.reason,
        updatedAt: new Date().toISOString(),
      }
      mockBookings[idx] = updated
      return updated
    }
  }
  {
    const p = m('/bookings/:bid')
    if (method === 'GET' && p) {
      const found = mockBookings.find((b) => b.id === Number(p.bid))
      if (!found) throw new HttpError(404, '找不到預約')
      return found
    }
  }

  throw new HttpError(404, `Mock 未實作：${method} ${pathname}`)
}

// ---------- helpers ----------

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/** 極簡的路徑比對 `/foo/:x/bar` → { x } */
function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pParts = pattern.split('/').filter(Boolean)
  const parts = path.split('/').filter(Boolean)
  if (pParts.length !== parts.length) return null
  const out: Record<string, string> = {}
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(':')) out[pParts[i].slice(1)] = parts[i]
    else if (pParts[i] !== parts[i]) return null
  }
  return out
}

export { HttpError as MockHttpError }
