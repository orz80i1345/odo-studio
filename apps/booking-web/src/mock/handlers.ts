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
  const params = new URLSearchParams(search)
  const query = Object.fromEntries(params)
  const filters = params.getAll('filter')
  const m = (pattern: string) => matchRoute(pattern, pathname)

  // ---------------- 顧客 auth ----------------
  if (method === 'POST' && (pathname === '/customer/auth/login' || pathname === '/auth/login')) {
    const input = body as LoginInput & { account?: string }
    const email = input.email || input.account || mockCustomer.email
    const session: CustomerAuthSession = {
      token: 'mock-token-' + Math.random().toString(36).slice(2),
      customer: { ...mockCustomer, email },
    }
    return pathname === '/auth/login'
      ? { data: { access_token: session.token, refresh_token: 'mock-refresh-token' } }
      : session
  }
  if (method === 'POST' && (pathname === '/customer/auth/register' || pathname === '/auth/register')) {
    const input = body as RegisterInput & { account?: string }
    const session: CustomerAuthSession = {
      token: 'mock-token-' + Math.random().toString(36).slice(2),
      customer: {
        ...mockCustomer,
        email: input.email || input.account || mockCustomer.email,
        phone: input.phone,
        displayName: input.displayName,
      },
    }
    return pathname === '/auth/register' ? { data: { id: mockCustomer.id, account: session.customer.email } } : session
  }
  if (method === 'GET' && pathname === '/customer/auth/me') {
    return mockCustomer
  }
  if (method === 'GET' && pathname === '/public/customer_accounts') {
    return scaffoldList([toRawCustomer(mockCustomer)], 1, 1)
  }
  if (method === 'POST' && pathname === '/public/customer_accounts') {
    const input = body as { email: string; phone?: string; display_name?: string; marketing_opt_in?: boolean }
    return { data: toRawCustomer({ ...mockCustomer, email: input.email, phone: input.phone, displayName: input.display_name, marketingOptIn: input.marketing_opt_in ?? false }) }
  }
  if (method === 'POST' && (pathname === '/customer/auth/logout' || pathname === '/auth/logout')) {
    return undefined
  }

  // ---------------- 攝影棚 ----------------
  if (method === 'GET' && pathname === '/studios') {
    return { items: mockStudios, page: 1, pageSize: 20, total: mockStudios.length }
  }
  if (method === 'GET' && pathname === '/public/studios') {
    const slug = filterValue(filters, 'slug')
    const items = slug ? mockStudios.filter((s) => s.slug === slug) : mockStudios
    return scaffoldList(items.map(toRawStudio), 1, Number(query.pageSize || 50))
  }
  {
    const p = m('/public/studios/:key')
    if (method === 'GET' && p) {
      const found = mockStudios.find((s) => s.id === Number(p.key))
      if (!found) throw new HttpError(404, '找不到攝影棚')
      return { data: toRawStudio(found) }
    }
  }
  if (method === 'GET' && pathname === '/public/studio_images') {
    const ids = numberFilterValues(filters, 'studio_id')
    const images = mockStudios.flatMap((s) => s.images).filter((img) => ids.length === 0 || ids.includes(img.studioId))
    return scaffoldList(images.map(toRawStudioImage), 1, Number(query.pageSize || 200))
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
  if (method === 'GET' && pathname === '/public/scenes') {
    const slug = filterValue(filters, 'slug')
    const studioId = Number(filterValue(filters, 'studio_id'))
    const items = mockScenes.filter((s) =>
      (!slug || s.slug === slug) &&
      (!studioId || s.studioId === studioId)
    )
    return scaffoldList(items.map(toRawScene), 1, Number(query.pageSize || 100))
  }
  {
    const p = m('/public/scenes/:key')
    if (method === 'GET' && p) {
      const found = mockScenes.find((s) => s.id === Number(p.key))
      if (!found) throw new HttpError(404, '找不到佈景')
      return { data: toRawScene(found) }
    }
  }
  if (method === 'GET' && pathname === '/public/scene_images') {
    const ids = numberFilterValues(filters, 'scene_id')
    const images = mockScenes.flatMap((s) => s.images).filter((img) => ids.length === 0 || ids.includes(img.sceneId))
    return scaffoldList(images.map(toRawSceneImage), 1, Number(query.pageSize || 200))
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
  if (method === 'GET' && pathname === '/public/pricing_plans') {
    const studioId = Number(filterValue(filters, 'studio_id'))
    const list = studioId ? mockPricingPlans.filter((p) => p.studioId === studioId) : mockPricingPlans
    return scaffoldList(list.map(toRawPricingPlan), 1, Number(query.pageSize || 100))
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
  if (method === 'GET' && pathname === '/public/time_slots') {
    const studioId = Number(filterValue(filters, 'studio_id') || 1)
    const date = filterValue(filters, 'slot_date') || new Date().toISOString().slice(0, 10)
    const slots = buildDaySlots(studioId, date).slots
    return scaffoldList(slots.map(toRawTimeSlot), 1, Number(query.pageSize || 200))
  }

  // ---------------- 銀行帳戶 ----------------
  if (method === 'GET' && pathname === '/bank-accounts') return mockBankAccounts
  if (method === 'GET' && pathname === '/public/bank_accounts') {
    return scaffoldList(mockBankAccounts.map(toRawBankAccount), 1, Number(query.pageSize || 20))
  }

  // ---------------- bookings ----------------
  if (method === 'POST' && (pathname === '/bookings' || pathname === '/public/bookings')) {
    const input = body as CreateBookingInput & ReturnType<typeof toRawBookingCreate>
    const studioId = input.studioId ?? input.studio_id
    const studio = pickStudio(studioId)
    const startAt = new Date(input.startAt ?? input.start_at)
    const endAt = new Date(input.endAt ?? input.end_at)
    const hours = Math.round(((+endAt - +startAt) / 3_600_000) * 100) / 100
    const dow = startAt.getDay()
    const hourlyPrice = dow === 0 || dow === 6 ? 1600 : studio.defaultHourlyPrice
    const subtotal = Math.round(input.subtotal ?? hourlyPrice * hours)
    const now = new Date().toISOString()
    const booking: Booking = {
      id: bookingSeq + 1,
      bookingNumber: input.booking_number ?? nextBookingNumber(),
      studioId,
      customerAccountId: mockCustomer.id,
      customerName: input.customerName ?? input.customer_name,
      customerPhone: input.customerPhone ?? input.customer_phone,
      customerEmail: input.customerEmail ?? input.customer_email,
      startAt: input.startAt ?? input.start_at,
      endAt: input.endAt ?? input.end_at,
      totalHours: hours,
      headcount: input.headcount,
      purpose: input.purpose,
      sceneIds: input.sceneIds ?? (Array.isArray(input.scene_ids) ? input.scene_ids : []),
      subtotal,
      discountAmount: 0,
      taxAmount: 0,
      totalPrice: input.total_price ?? subtotal,
      depositAmount: input.deposit_amount ?? subtotal,
      status: 'pending',
      paymentStatus: 'unpaid',
      customerNote: input.customerNote ?? input.customer_note,
      source: 'web' as BookingSource,
      bookingMode: input.bookingMode ?? 'scenes',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    }
    mockBookings.unshift(booking)
    return pathname === '/public/bookings' ? { data: toRawBooking(booking) } : booking
  }

  if (method === 'GET' && pathname === '/my/bookings') {
    return { items: mockBookings, page: 1, pageSize: 20, total: mockBookings.length }
  }
  if (method === 'GET' && pathname === '/public/bookings') {
    const email = filterValue(filters, 'customer_email')
    const items = email ? mockBookings.filter((b) => b.customerEmail === email) : mockBookings
    return scaffoldList(items.map(toRawBooking), 1, Number(query.pageSize || 50))
  }
  {
    const p = m('/public/bookings/:bid')
    if (method === 'GET' && p) {
      const found = mockBookings.find((b) => b.id === Number(p.bid))
      if (!found) throw new HttpError(404, '找不到預約')
      return { data: toRawBooking(found) }
    }
    if (method === 'PATCH' && p) {
      const idx = mockBookings.findIndex((b) => b.id === Number(p.bid))
      if (idx < 0) throw new HttpError(404, '找不到預約')
      const patch = body as { cancellation_reason?: string; cancelled_at?: string }
      const updated: Booking = {
        ...mockBookings[idx],
        status: 'cancelled',
        cancelledAt: patch.cancelled_at ?? new Date().toISOString(),
        cancellationReason: patch.cancellation_reason,
        updatedAt: new Date().toISOString(),
      }
      mockBookings[idx] = updated
      return { data: toRawBooking(updated) }
    }
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

function scaffoldList<T>(data: T[], page: number, pageSize: number) {
  return { data, pagination: { page, pageSize, total: data.length } }
}

function filterValue(filters: string[], field: string): string | undefined {
  const found = filters.find((f) => f.startsWith(`${field},`))
  return found?.split(',').slice(2).join(',')
}

function numberFilterValues(filters: string[], field: string): number[] {
  const value = filterValue(filters, field)
  if (!value) return []
  return value.split(',').map(Number).filter(Number.isFinite)
}

function toRawCustomer(c: typeof mockCustomer) {
  return {
    id: c.id,
    email: c.email,
    phone: c.phone,
    display_name: c.displayName,
    marketing_opt_in: c.marketingOptIn,
    locale: c.locale,
    is_active: c.isActive,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}

function toRawStudio(s: (typeof mockStudios)[number]) {
  return {
    id: s.id, slug: s.slug, name: s.name, description: s.description, address: s.address,
    floor: s.floor, area_ping: s.areaPing, capacity: s.capacity, features: s.features,
    default_hourly_price: s.defaultHourlyPrice, min_booking_minutes: s.minBookingMinutes,
    max_booking_minutes: s.maxBookingMinutes, booking_increment_minutes: s.bookingIncrementMinutes,
    advance_booking_days: s.advanceBookingDays, cancellation_hours: s.cancellationHours,
    is_active: s.isActive, created_at: s.createdAt, updated_at: s.updatedAt,
  }
}

function toRawStudioImage(img: (typeof mockStudios)[number]['images'][number]) {
  return {
    id: img.id, studio_id: img.studioId, url: img.url, alt_text: img.altText,
    caption: img.caption, is_cover: img.isCover, display_order: img.displayOrder,
  }
}

function toRawScene(s: (typeof mockScenes)[number]) {
  return {
    id: s.id, studio_id: s.studioId, slug: s.slug, name: s.name, description: s.description,
    tags: s.tags, display_order: s.displayOrder, is_active: s.isActive,
    created_at: s.createdAt, updated_at: s.updatedAt,
  }
}

function toRawSceneImage(img: (typeof mockScenes)[number]['images'][number]) {
  return {
    id: img.id, scene_id: img.sceneId, url: img.url, alt_text: img.altText,
    caption: img.caption, is_cover: img.isCover, display_order: img.displayOrder,
  }
}

function toRawPricingPlan(p: (typeof mockPricingPlans)[number]) {
  return {
    id: p.id, studio_id: p.studioId, name: p.name, plan_type: p.planType,
    hourly_price: p.hourlyPrice, package_price: p.packagePrice, package_hours: p.packageHours,
    applies_to_weekdays: p.appliesToWeekdays, start_minute: p.startMinute,
    end_minute: p.endMinute, effective_from: p.effectiveFrom, effective_to: p.effectiveTo,
    min_hours: p.minHours, max_hours: p.maxHours, priority: p.priority, is_active: p.isActive,
  }
}

function toRawTimeSlot(s: ReturnType<typeof buildDaySlots>['slots'][number]) {
  return {
    id: s.id, studio_id: s.studioId, slot_date: s.slotDate, start_minute: s.startMinute,
    end_minute: s.endMinute, status: s.status, hourly_price: s.hourlyPrice,
  }
}

function toRawBankAccount(b: (typeof mockBankAccounts)[number]) {
  return {
    id: b.id, bank_name: b.bankName, bank_code: b.bankCode, branch_name: b.branchName,
    branch_code: b.branchCode, account_number: b.accountNumber, account_holder: b.accountHolder,
    display_name: b.displayName, is_default: b.isDefault,
  }
}

function toRawBooking(b: Booking) {
  return {
    id: b.id, booking_number: b.bookingNumber, studio_id: b.studioId,
    customer_account_id: b.customerAccountId, customer_name: b.customerName,
    customer_phone: b.customerPhone, customer_email: b.customerEmail, start_at: b.startAt,
    end_at: b.endAt, total_hours: b.totalHours, headcount: b.headcount, purpose: b.purpose,
    scene_ids: b.sceneIds, subtotal: b.subtotal, discount_amount: b.discountAmount,
    discount_code: b.discountCode, tax_amount: b.taxAmount, total_price: b.totalPrice,
    deposit_amount: b.depositAmount, status: b.status, payment_status: b.paymentStatus,
    customer_note: b.customerNote, confirmed_at: b.confirmedAt, cancelled_at: b.cancelledAt,
    cancellation_reason: b.cancellationReason, source: b.source, created_at: b.createdAt,
    updated_at: b.updatedAt,
  }
}

function toRawBookingCreate() {
  return {
    studio_id: 0, booking_number: '', customer_name: '', customer_phone: '', customer_email: '',
    start_at: '', end_at: '', total_hours: 0, subtotal: 0, total_price: 0, deposit_amount: 0,
    scene_ids: [] as ID[], customer_note: undefined as string | undefined,
  }
}

export { HttpError as MockHttpError }
