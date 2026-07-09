import type {
  BankAccount,
  Booking,
  CreateBookingInput,
  CustomerAccount,
  DayAvailability,
  DaySlotList,
  ID,
  MonthAvailability,
  Paginated,
  PricingPlan,
  Scene,
  SceneImage,
  Studio,
  StudioImage,
  TimeSlot,
} from '../../types'

export interface ScaffoldListResponse<T> {
  data: T[]
  pagination?: { page?: number; pageSize?: number; total?: number }
}

export interface ScaffoldItemResponse<T> {
  data: T
}

export interface RawStudio {
  id: ID
  slug: string
  name: string
  description?: string
  address?: string
  floor?: string
  area_ping?: number
  capacity?: number
  features?: unknown
  default_hourly_price: number
  min_booking_minutes?: number
  max_booking_minutes?: number
  booking_increment_minutes?: number
  advance_booking_days?: number
  cancellation_hours?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface RawStudioImage {
  id: ID
  studio_id: ID
  url: string
  alt_text?: string
  caption?: string
  is_cover?: boolean
  display_order?: number
}

export interface RawScene {
  id: ID
  studio_id: ID
  slug: string
  name: string
  description?: string
  tags?: unknown
  display_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface RawSceneImage {
  id: ID
  scene_id: ID
  url: string
  alt_text?: string
  caption?: string
  is_cover?: boolean
  display_order?: number
}

export interface RawPricingPlan {
  id: ID
  studio_id: ID
  name: string
  plan_type?: PricingPlan['planType']
  hourly_price: number
  package_price?: number
  package_hours?: number
  applies_to_weekdays?: unknown
  start_minute?: number
  end_minute?: number
  effective_from?: string
  effective_to?: string
  min_hours?: number
  max_hours?: number
  priority?: number
  is_active?: boolean
}

export interface RawTimeSlot {
  id: ID
  studio_id: ID
  slot_date: string
  start_minute: number
  end_minute: number
  status: TimeSlot['status']
  hourly_price?: number
}

export interface RawBooking {
  id: ID
  booking_number: string
  studio_id: ID
  customer_account_id?: ID
  customer_name: string
  customer_phone: string
  customer_email: string
  start_at: string
  end_at: string
  total_hours: number
  headcount?: number
  purpose?: string
  scene_ids?: unknown
  subtotal: number
  discount_amount?: number
  discount_code?: string
  tax_amount?: number
  total_price: number
  deposit_amount?: number
  status?: Booking['status']
  payment_status?: Booking['paymentStatus']
  customer_note?: string
  confirmed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  source?: Booking['source']
  created_at?: string
  updated_at?: string
}

export interface RawBankAccount {
  id: ID
  bank_name: string
  bank_code: string
  branch_name?: string
  branch_code?: string
  account_number: string
  account_holder: string
  display_name?: string
  is_default?: boolean
}

export interface RawCustomerAccount {
  id: ID
  email: string
  phone?: string
  display_name?: string
  email_verified_at?: string
  phone_verified_at?: string
  marketing_opt_in?: boolean
  locale?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export function unwrapItem<T>(res: T | ScaffoldItemResponse<T>): T {
  return hasData(res) ? res.data : res
}

export function unwrapList<T>(res: T[] | ScaffoldListResponse<T>): Paginated<T> {
  if (Array.isArray(res)) return { items: res, page: 1, pageSize: res.length, total: res.length }
  const items = res.data ?? []
  return {
    items,
    page: res.pagination?.page ?? 1,
    pageSize: res.pagination?.pageSize ?? items.length,
    total: res.pagination?.total ?? items.length,
  }
}

export function toScaffoldList<T, U>(res: T[] | ScaffoldListResponse<T>, map: (item: T) => U): Paginated<U> {
  const page = unwrapList(res)
  return { ...page, items: page.items.map(map) }
}

export function toStudio(raw: RawStudio, images: StudioImage[] = []): Studio {
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder)
  const cover = sorted.find((img) => img.isCover) ?? sorted[0]
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description ?? '',
    address: raw.address,
    floor: raw.floor,
    areaPing: Number(raw.area_ping ?? 0),
    capacity: raw.capacity,
    features: stringArray(raw.features),
    defaultHourlyPrice: Number(raw.default_hourly_price ?? 0),
    minBookingMinutes: raw.min_booking_minutes ?? 60,
    maxBookingMinutes: raw.max_booking_minutes ?? 480,
    bookingIncrementMinutes: raw.booking_increment_minutes ?? 30,
    advanceBookingDays: raw.advance_booking_days ?? 90,
    cancellationHours: raw.cancellation_hours ?? 48,
    images: sorted,
    coverUrl: cover?.url,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

export function toStudioImage(raw: RawStudioImage): StudioImage {
  return {
    id: raw.id,
    studioId: raw.studio_id,
    url: raw.url,
    altText: raw.alt_text,
    caption: raw.caption,
    isCover: raw.is_cover ?? false,
    displayOrder: raw.display_order ?? 0,
  }
}

export function toScene(raw: RawScene, images: SceneImage[] = []): Scene {
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder)
  const cover = sorted.find((img) => img.isCover) ?? sorted[0]
  return {
    id: raw.id,
    studioId: raw.studio_id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    tags: stringArray(raw.tags),
    displayOrder: raw.display_order ?? 0,
    isActive: raw.is_active ?? true,
    images: sorted,
    coverUrl: cover?.url,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

export function toSceneImage(raw: RawSceneImage): SceneImage {
  return {
    id: raw.id,
    sceneId: raw.scene_id,
    url: raw.url,
    altText: raw.alt_text,
    caption: raw.caption,
    isCover: raw.is_cover ?? false,
    displayOrder: raw.display_order ?? 0,
  }
}

export function toPricingPlan(raw: RawPricingPlan): PricingPlan {
  return {
    id: raw.id,
    studioId: raw.studio_id,
    name: raw.name,
    planType: raw.plan_type ?? 'hourly',
    hourlyPrice: Number(raw.hourly_price ?? 0),
    packagePrice: raw.package_price == null ? undefined : Number(raw.package_price),
    packageHours: raw.package_hours == null ? undefined : Number(raw.package_hours),
    appliesToWeekdays: numberArray(raw.applies_to_weekdays, [0, 1, 2, 3, 4, 5, 6]),
    startMinute: raw.start_minute,
    endMinute: raw.end_minute,
    effectiveFrom: raw.effective_from,
    effectiveTo: raw.effective_to,
    minHours: Number(raw.min_hours ?? 1),
    maxHours: raw.max_hours == null ? undefined : Number(raw.max_hours),
    priority: raw.priority ?? 0,
    isActive: raw.is_active ?? true,
  }
}

export function toTimeSlot(raw: RawTimeSlot): TimeSlot {
  return {
    id: raw.id,
    studioId: raw.studio_id,
    slotDate: dateOnly(raw.slot_date),
    startMinute: raw.start_minute,
    endMinute: raw.end_minute,
    status: raw.status,
    hourlyPrice: raw.hourly_price == null ? undefined : Number(raw.hourly_price),
  }
}

export function toBooking(raw: RawBooking): Booking {
  return {
    id: raw.id,
    bookingNumber: raw.booking_number,
    studioId: raw.studio_id,
    customerAccountId: raw.customer_account_id,
    customerName: raw.customer_name,
    customerPhone: raw.customer_phone,
    customerEmail: raw.customer_email,
    startAt: raw.start_at,
    endAt: raw.end_at,
    totalHours: Number(raw.total_hours ?? 0),
    headcount: raw.headcount,
    purpose: raw.purpose,
    sceneIds: numberArray(raw.scene_ids),
    subtotal: Number(raw.subtotal ?? 0),
    discountAmount: Number(raw.discount_amount ?? 0),
    discountCode: raw.discount_code,
    taxAmount: Number(raw.tax_amount ?? 0),
    totalPrice: Number(raw.total_price ?? 0),
    depositAmount: Number(raw.deposit_amount ?? 0),
    status: raw.status ?? 'pending',
    paymentStatus: raw.payment_status ?? 'unpaid',
    customerNote: raw.customer_note,
    confirmedAt: raw.confirmed_at,
    cancelledAt: raw.cancelled_at,
    cancellationReason: raw.cancellation_reason,
    source: raw.source ?? 'web',
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

export function toBookingCreate(input: CreateBookingInput, totals: { subtotal: number; totalPrice: number; depositAmount: number }): Omit<RawBooking, 'id'> {
  const start = new Date(input.startAt)
  const end = new Date(input.endAt)
  return {
    booking_number: buildBookingNumber(),
    studio_id: input.studioId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    customer_email: input.customerEmail,
    start_at: input.startAt,
    end_at: input.endAt,
    total_hours: Math.round(((+end - +start) / 3_600_000) * 100) / 100,
    headcount: input.headcount,
    purpose: input.purpose,
    scene_ids: input.sceneIds ?? [],
    subtotal: totals.subtotal,
    discount_amount: 0,
    tax_amount: 0,
    total_price: totals.totalPrice,
    deposit_amount: totals.depositAmount,
    status: 'pending',
    payment_status: 'unpaid',
    customer_note: input.customerNote,
    source: 'web',
  }
}

export function toBankAccount(raw: RawBankAccount): BankAccount {
  return {
    id: raw.id,
    bankName: raw.bank_name,
    bankCode: raw.bank_code,
    branchName: raw.branch_name,
    branchCode: raw.branch_code,
    accountNumber: raw.account_number,
    accountHolder: raw.account_holder,
    displayName: raw.display_name,
    isDefault: raw.is_default ?? false,
  }
}

export function toCustomer(raw: RawCustomerAccount): CustomerAccount {
  return {
    id: raw.id,
    email: raw.email,
    phone: raw.phone,
    displayName: raw.display_name,
    emailVerifiedAt: raw.email_verified_at,
    phoneVerifiedAt: raw.phone_verified_at,
    marketingOptIn: raw.marketing_opt_in ?? false,
    locale: raw.locale ?? 'zh-TW',
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '',
  }
}

export function monthAvailability(studioId: ID, yearMonth: string, slots: TimeSlot[]): MonthAvailability {
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const slotsByDate = new Map<string, TimeSlot[]>()
  for (const slot of slots) {
    const list = slotsByDate.get(slot.slotDate) ?? []
    list.push(slot)
    slotsByDate.set(slot.slotDate, list)
  }

  const days: DayAvailability[] = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${yearMonth}-${String(i + 1).padStart(2, '0')}`
    const daySlots = slotsByDate.get(date) ?? []
    const availableCount = daySlots.filter((slot) => slot.status === 'available').length
    const openStartMinute = daySlots.length ? Math.min(...daySlots.map((slot) => slot.startMinute)) : undefined
    const openEndMinute = daySlots.length ? Math.max(...daySlots.map((slot) => slot.endMinute)) : undefined
    return {
      date,
      isClosed: daySlots.length === 0 || daySlots.every((slot) => slot.status === 'holiday'),
      openStartMinute,
      openEndMinute,
      availableCount,
      totalCount: daySlots.length,
      priceMultiplier: undefined,
    }
  })

  return { studioId, yearMonth, days }
}

export function daySlotList(studioId: ID, date: string, slots: TimeSlot[]): DaySlotList {
  return {
    studioId,
    date,
    isClosed: slots.length === 0 || slots.every((slot) => slot.status === 'holiday'),
    slots: [...slots].sort((a, b) => a.startMinute - b.startMinute),
  }
}

export function filter(field: string, op: string, value: string | number | boolean): string {
  return `${field},${op},${value}`
}

export function dateOnly(value: string): string {
  return value.slice(0, 10)
}

function hasData<T>(value: T | ScaffoldItemResponse<T>): value is ScaffoldItemResponse<T> {
  return typeof value === 'object' && value !== null && 'data' in value
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return value ? [value] : []
    }
  }
  return []
}

function numberArray(value: unknown, fallback: number[] = []): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(Number.isFinite)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : fallback
    } catch {
      return fallback
    }
  }
  return fallback
}

function buildBookingNumber(): string {
  const now = new Date()
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  return `ODE-${ymd}-${String(now.getTime()).slice(-6)}`
}
