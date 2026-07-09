/**
 * mock/data.ts
 * 開發用假資料，貼合 shared/types。真正上線時關掉 mock.enabled 即可。
 */
import type {
  Booking, BankAccount, CustomerAccount, DaySlotList, ID, MonthAvailability,
  PricingPlan, Scene, Studio, TimeSlot,
} from '@studio/shared'

const now = () => new Date().toISOString()

export const mockCustomer: CustomerAccount = {
  id: 1,
  email: 'demo@ode.studio',
  phone: '0912345678',
  displayName: '示範顧客',
  marketingOptIn: false,
  locale: 'zh-TW',
  isActive: true,
  createdAt: now(),
  updatedAt: now(),
}

export const mockStudios: Studio[] = [
  {
    id: 1,
    slug: 'north-window',
    name: '北窗棚',
    description:
      '面向淡水河的北向窗景，全日柔和自然光。木地板、白牆與少量傢俱，適合人像、生活雜誌感、產品陳列。',
    address: '台北市中山區某路 12 號 5 樓',
    floor: '5F',
    areaPing: 18.5,
    capacity: 8,
    features: ['自然光', '白牆', '木地板', '化妝間', 'Wi-Fi', '影棚燈'],
    defaultHourlyPrice: 1200,
    minBookingMinutes: 120,
    maxBookingMinutes: 480,
    bookingIncrementMinutes: 60,
    advanceBookingDays: 90,
    cancellationHours: 48,
    coverUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=75',
    images: [
      { id: 11, studioId: 1, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=75', isCover: true, displayOrder: 0 },
      { id: 12, studioId: 1, url: 'https://images.unsplash.com/photo-1594873604892-b599f847e859?w=1200&q=75', isCover: false, displayOrder: 1 },
      { id: 13, studioId: 1, url: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1200&q=75', isCover: false, displayOrder: 2 },
    ],
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 2,
    slug: 'river-terrace',
    name: '河景陽台',
    description:
      '半戶外磨石陽台，早上偏冷光，下午轉為金黃斜光。搭配藤椅與植栽，適合服飾、生活風、婚攝側拍。',
    address: '台北市中山區某路 12 號 6 樓',
    floor: '6F',
    areaPing: 12,
    capacity: 6,
    features: ['半戶外', '斜射光', '植栽', '磨石地', '藤傢俱'],
    defaultHourlyPrice: 1500,
    minBookingMinutes: 120,
    maxBookingMinutes: 480,
    bookingIncrementMinutes: 60,
    advanceBookingDays: 90,
    cancellationHours: 48,
    coverUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=75',
    images: [
      { id: 21, studioId: 2, url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=75', isCover: true, displayOrder: 0 },
      { id: 22, studioId: 2, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=75', isCover: false, displayOrder: 1 },
    ],
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
]

export const mockScenes: Scene[] = [
  {
    id: 101, studioId: 1, slug: 'window-corner', name: '窗邊角落',
    description: '白紗窗簾與矮几，光線最柔的角落。',
    tags: ['自然光', '白色', '極簡'], displayOrder: 0, isActive: true,
    coverUrl: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=75',
    images: [
      { id: 1011, sceneId: 101, url: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&q=75', isCover: true, displayOrder: 0 },
      { id: 1012, sceneId: 101, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=75', isCover: false, displayOrder: 1 },
    ],
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 102, studioId: 1, slug: 'wooden-bench', name: '木長椅',
    description: '一張舊木長椅、素牆、與植栽陰影。',
    tags: ['木質', '溫暖', '生活感'], displayOrder: 1, isActive: true,
    coverUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=75',
    images: [
      { id: 1021, sceneId: 102, url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=75', isCover: true, displayOrder: 0 },
    ],
    createdAt: now(), updatedAt: now(),
  },
  {
    id: 201, studioId: 2, slug: 'terrace-plants', name: '陽台植栽區',
    description: '大棵橄欖樹與磨石檯面。',
    tags: ['戶外', '植栽', '斜光'], displayOrder: 0, isActive: true,
    coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=75',
    images: [
      { id: 2011, sceneId: 201, url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=75', isCover: true, displayOrder: 0 },
    ],
    createdAt: now(), updatedAt: now(),
  },
]

export const mockPricingPlans: PricingPlan[] = [
  { id: 1, studioId: 1, name: '平日方案', planType: 'hourly', hourlyPrice: 1200, appliesToWeekdays: [1,2,3,4,5], minHours: 2, priority: 10, isActive: true },
  { id: 2, studioId: 1, name: '假日方案', planType: 'hourly', hourlyPrice: 1600, appliesToWeekdays: [0,6], minHours: 2, priority: 20, isActive: true },
  { id: 3, studioId: 2, name: '平日方案', planType: 'hourly', hourlyPrice: 1500, appliesToWeekdays: [1,2,3,4,5], minHours: 2, priority: 10, isActive: true },
  { id: 4, studioId: 2, name: '假日方案', planType: 'hourly', hourlyPrice: 2000, appliesToWeekdays: [0,6], minHours: 2, priority: 20, isActive: true },
]

export const mockBankAccounts: BankAccount[] = [
  {
    id: 1, bankName: '國泰世華銀行', bankCode: '013', branchName: '中山分行',
    accountNumber: '123-456-789012', accountHolder: '河日影像有限公司',
    displayName: '主要收款帳戶', isDefault: true,
  },
]

/** 依 studio 與月份決定該月每一天的可用性摘要（穩定不隨機） */
export function buildMonthAvailability(studioId: ID, yearMonth: string): MonthAvailability {
  const [y, m] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(iso).getDay()
    const seed = (studioId * 31 + d) % 7
    const isClosed = dow === 1 && seed < 2                        // 週一部分公休
    const availableCount = isClosed ? 0 : Math.max(0, 12 - (seed + (dow === 6 ? 4 : 0)))
    return {
      date: iso,
      isClosed,
      openStartMinute: isClosed ? undefined : 9 * 60,
      openEndMinute: isClosed ? undefined : 21 * 60,
      availableCount,
      totalCount: 12,
      priceMultiplier: dow === 0 || dow === 6 ? 1.3 : 1,
    }
  })
  return { studioId, yearMonth, days }
}

/** 依 studio 與日期生成該日 60 分鐘時段（穩定不隨機） */
export function buildDaySlots(studioId: ID, date: string): DaySlotList {
  const dow = new Date(date).getDay()
  const seed = studioId * 7 + Number(date.slice(-2))
  const isClosed = dow === 1 && seed % 5 === 0
  const slots: TimeSlot[] = []
  if (!isClosed) {
    for (let h = 9; h < 21; h++) {
      const startMinute = h * 60
      const endMinute = (h + 1) * 60
      const taken = (seed + h) % 4 === 0
      slots.push({
        id: studioId * 10000 + Number(date.replace(/-/g, '').slice(-4)) * 100 + h,
        studioId,
        slotDate: date,
        startMinute,
        endMinute,
        status: taken ? 'booked' : 'available',
        hourlyPrice: dow === 0 || dow === 6 ? 1600 : 1200,
      })
    }
  }
  return { studioId, date, isClosed, slots }
}

/** 記憶體中的預約單清單（用於「我的預約」；重整頁面即消失） */
export const mockBookings: Booking[] = []
