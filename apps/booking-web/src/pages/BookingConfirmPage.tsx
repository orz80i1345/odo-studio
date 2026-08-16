/**
 * BookingConfirmPage — 預約流程第 2 步：確認 + 填聯絡資料
 *
 * 路徑：/book/:studioId/confirm?start=<ISO>&end=<ISO>
 *
 * 重點：
 *  - 從 useAuth 取得 user，自動預填 email / displayName / phone
 *  - 佈景多選（SceneMultiSelect），可空
 *  - 送出 → useCreateBooking → navigate 到 /bookings/:id/success
 *  - URL 缺 start/end 時，顯示錯誤並提供回選頁的按鈕
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError, Button, discountCodesApi, Spinner, type AppliedDiscount, type ID } from '@studio/shared'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { useDaySlots } from '../hooks/useAvailability'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { useEquipmentItems, useEquipmentReservations } from '../hooks/useEquipment'
import { useScenePrices, useStudioBuyoutPrice } from '../hooks/usePricing'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { Input, Textarea } from '../components/ui/Input'
import { BookingSummary } from '../components/Booking/BookingSummary'

const schema = z.object({
  headcount: z.coerce.number().int().min(1).max(50).optional(),
  purpose: z.string().max(120).optional(),
  customerNote: z.string().max(500).optional(),
})
type Form = z.infer<typeof schema>

export function BookingConfirmPage() {
  const { studioId } = useParams<{ studioId: string }>()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { user } = useAuth()

  const startAt = params.get('start')
  const endAt = params.get('end')
  const selectedSceneIds = parseSceneIds(params.get('scenes'))
  const bookingMode = params.get('mode') === 'buyout' ? 'buyout' : 'scenes'

  const studioIdNum = studioId ? Number(studioId) : undefined
  const { data: studio, isLoading } = useStudio(studioIdNum)
  const { data: scenes } = useScenes(studioIdNum)

  const [serverError, setServerError] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<ID[]>([])

  const create = useCreateBooking()
  const slotDate = startAt ? localDateFromIso(startAt) : null
  const { data: daySlots } = useDaySlots(studioIdNum, slotDate)
  const allSceneIds = scenes?.items.map((scene) => scene.id) ?? []
  const { data: scenePrices } = useScenePrices(allSceneIds)
  const { data: buyoutPrice } = useStudioBuyoutPrice(studioIdNum)
  const { data: equipmentPage } = useEquipmentItems()
  const selectedTimeSlotIds = useMemo(() => {
    if (!startAt || !endAt || !daySlots) return []
    const { startMinute, endMinute } = bookingRangeMinutes(startAt, endAt)
    return daySlots.slots
      .filter((slot) => slot.startMinute >= startMinute && slot.endMinute <= endMinute)
      .map((slot) => slot.id)
  }, [daySlots, endAt, startAt])
  const { data: equipmentReservations } = useEquipmentReservations(selectedTimeSlotIds)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const sceneNames = useMemo(
    () => scenes?.items.filter((s) => selectedSceneIds.includes(s.id)).map((s) => s.name) ?? [],
    [scenes, selectedSceneIds],
  )
  const scenePriceById = useMemo(
    () => new Map(scenePrices?.map((price) => [price.sceneId, price.hourlyPrice]) ?? []),
    [scenePrices],
  )
  const reservedEquipmentIds = useMemo(
    () => new Set(equipmentReservations?.map((item) => item.equipmentItemId) ?? []),
    [equipmentReservations],
  )
  const selectedEquipment = useMemo(
    () => equipmentPage?.items.filter((item) => selectedEquipmentIds.includes(item.id)) ?? [],
    [equipmentPage, selectedEquipmentIds],
  )
  const pricePreview = useMemo(() => {
    if (!startAt || !endAt || !daySlots || !studio) return null
    const { startMinute, endMinute } = bookingRangeMinutes(startAt, endAt)
    const slots = daySlots.slots.filter((slot) => slot.startMinute >= startMinute && slot.endMinute <= endMinute)
    const start = new Date(startAt)
    const end = new Date(endAt)
    const hours = Math.round(((+end - +start) / 3_600_000) * 100) / 100
    const fallbackHourly = slots.length > 0
      ? slots.reduce((sum, slot) => sum + Number(slot.hourlyPrice ?? 0), 0) / slots.length
      : studio.defaultHourlyPrice
    const hourlyPrice = bookingMode === 'buyout'
      ? buyoutPrice?.hourlyPrice ?? fallbackHourly
      : selectedSceneIds.reduce((sum, sceneId) => sum + (scenePriceById.get(sceneId) ?? fallbackHourly), 0)
    const subtotal = Math.round(hourlyPrice * hours)
    const equipmentTotal = selectedEquipment.reduce((sum, item) => sum + item.unitPrice, 0)
    const discountAmount = Math.min(appliedDiscount?.discountTotal ?? 0, subtotal)
    return {
      subtotal: subtotal + equipmentTotal,
      studioSubtotal: subtotal,
      equipmentTotal,
      hours,
      hourlyPrice,
      discountAmount,
      totalPrice: Math.max(0, subtotal + equipmentTotal - discountAmount),
    }
  }, [appliedDiscount, bookingMode, buyoutPrice, daySlots, endAt, selectedEquipment, selectedSceneIds, scenePriceById, startAt, studio])

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!studio) return <p className="py-16 text-center text-ink-2">找不到攝影棚。</p>

  if (!startAt || !endAt || selectedSceneIds.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-serif text-xl text-ink">尚未選擇時段</p>
        <p className="mt-2 text-sm text-ink-2">請先回月曆選日期、時段與佈景。</p>
        <Link
          to={`/book/${studioIdNum}`}
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover"
        >
          回到月曆
        </Link>
      </div>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null)
      if (!user?.email || !user.displayName || !user.phone) {
        setServerError('會員資料不完整，請先補齊姓名、電話與 Email。')
        return
      }
      const booking = await create.mutateAsync({
        studioId: studio.id,
        startAt,
        endAt,
        customerName: user.displayName,
        customerPhone: user.phone,
        customerEmail: user.email,
        headcount: values.headcount,
        purpose: values.purpose || undefined,
        customerNote: values.customerNote || undefined,
        sceneIds: selectedSceneIds,
        bookingMode,
        discount: appliedDiscount ?? undefined,
        equipmentItemIds: selectedEquipmentIds,
      })
      nav(`/bookings/${booking.id}/success`, { replace: true })
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : '送出失敗，請稍後再試')
    }
  })

  async function applyDiscount() {
    if (!pricePreview) return
    const code = discountCodesApi.normalizeCode(discountCode)
    if (!code) {
      setDiscountError('請輸入折扣碼')
      return
    }
    try {
      setDiscountError(null)
      setIsApplyingDiscount(true)
      const discount = await discountCodesApi.validateHourlyDiscountCode(api, {
        code,
        subtotal: pricePreview.subtotal,
        totalHours: pricePreview.hours,
      })
      setDiscountCode(discount.code)
      setAppliedDiscount(discount)
    } catch (e) {
      setAppliedDiscount(null)
      setDiscountError(e instanceof ApiError && e.status === 404 ? '找不到此折扣碼' : e instanceof Error ? e.message : '折扣碼無法使用')
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`預約 · ${studio.name}`}
        title="確認資料並送出"
        subtitle="預約會先建立為「待付款」，收到你的匯款後由我們手動確認。"
        actions={
          <Link
            to={`/book/${studioIdNum}`}
            className="text-sm text-ink-2 hover:text-ink"
          >
            ← 重新選擇時段
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* 表單 */}
        <form onSubmit={onSubmit} className="min-w-0 space-y-8 rounded-xl border border-line bg-surface p-6 md:p-8">
          <section className="space-y-4">
            <h3 className="font-serif text-lg text-ink">聯絡資料</h3>
            <dl className="grid gap-3 rounded-lg border border-line bg-sunken p-4 text-sm sm:grid-cols-3">
              <ContactRow label="姓名" value={user?.displayName ?? '尚未設定'} />
              <ContactRow label="電話" value={user?.phone ?? '尚未設定'} />
              <ContactRow label="Email" value={user?.email ?? '尚未設定'} />
            </dl>
          </section>

          <section className="space-y-4 border-t border-line pt-8">
            <div>
              <h3 className="font-serif text-lg text-ink">器材租借（選填）</h3>
              <p className="mt-1 text-sm text-ink-3">每項器材同一時段只能租借一次；已被租借的器材會無法選擇。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(equipmentPage?.items ?? []).map((item) => {
                const unavailable = reservedEquipmentIds.has(item.id)
                const selected = selectedEquipmentIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={unavailable}
                    onClick={() => {
                      setSelectedEquipmentIds((ids) =>
                        ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id],
                      )
                    }}
                    className={[
                      'min-h-24 rounded-lg border p-4 text-left transition-colors',
                      unavailable
                        ? 'cursor-not-allowed border-line bg-sunken text-ink-3 opacity-60'
                        : selected
                          ? 'border-brand bg-brand-subtle text-brand-subtle-ink'
                          : 'border-line bg-sunken text-ink-2 hover:border-line-strong hover:text-ink',
                    ].join(' ')}
                  >
                    <span className="block font-medium">{item.name}</span>
                    {item.description && <span className="mt-1 block text-xs opacity-80">{item.description}</span>}
                    <span className="mt-3 block text-sm text-ink">NT$ {item.unitPrice.toLocaleString()}</span>
                    {unavailable && <span className="mt-2 block text-xs text-danger">此時段已被租借</span>}
                  </button>
                )
              })}
              {equipmentPage && equipmentPage.items.length === 0 && (
                <p className="rounded-lg border border-line bg-sunken p-4 text-sm text-ink-3 sm:col-span-2">
                  目前沒有可租借器材。
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-line pt-8">
            <h3 className="font-serif text-lg text-ink">折扣碼</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={discountCode}
                onChange={(event) => {
                  setDiscountCode(event.target.value)
                  setAppliedDiscount(null)
                  setDiscountError(null)
                }}
                placeholder="輸入折扣碼"
                className="uppercase"
              />
              <div className="flex gap-2">
                <Button type="button" variant="secondary" disabled={isApplyingDiscount || !pricePreview} onClick={applyDiscount}>
                  {isApplyingDiscount ? '套用中…' : '套用'}
                </Button>
                {appliedDiscount && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedDiscount(null)
                      setDiscountCode('')
                    }}
                    className="h-10 rounded-lg border border-line px-4 text-sm text-ink-2 hover:bg-sunken hover:text-ink"
                  >
                    移除
                  </button>
                )}
              </div>
            </div>
            {appliedDiscount && (
              <p className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success-subtle-ink">
                已套用 {appliedDiscount.code}，每小時折 NT$ {appliedDiscount.discountAmount.toLocaleString()}。
              </p>
            )}
            {discountError && (
              <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">{discountError}</p>
            )}
          </section>

          <section className="space-y-4 border-t border-line pt-8">
            <h3 className="font-serif text-lg text-ink">拍攝資訊（選填）</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="預估人數" htmlFor="headcount" error={errors.headcount?.message}>
                <Input
                  id="headcount"
                  type="number"
                  min={1}
                  max={50}
                  placeholder="含攝影師與被攝者"
                  invalid={!!errors.headcount}
                  {...register('headcount')}
                />
              </Field>
              <Field label="用途" htmlFor="purpose" error={errors.purpose?.message}
                hint="例如：品牌形象、人像寫真、家庭紀念"
              >
                <Input
                  id="purpose"
                  invalid={!!errors.purpose}
                  {...register('purpose')}
                />
              </Field>
            </div>

            <Field label="給我們的備註" htmlFor="customerNote" error={errors.customerNote?.message}
              hint="場地佈置需求、抵達時間、器材協助等"
            >
              <Textarea
                id="customerNote"
                invalid={!!errors.customerNote}
                {...register('customerNote')}
              />
            </Field>
          </section>

          {serverError && (
            <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">
              {serverError}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-line pt-6">
            <p className="text-xs text-ink-3">
              送出後將建立訂單，並顯示匯款帳號。
            </p>
            <Button type="submit" disabled={isSubmitting || create.isPending || selectedSceneIds.length === 0}>
              {isSubmitting || create.isPending ? '送出中…' : '確認送出'}
            </Button>
          </div>
        </form>

        {/* 側欄：訂單摘要 */}
        <aside className="h-fit">
          <BookingSummary
            studio={studio}
            startAt={startAt}
            endAt={endAt}
            totalPrice={pricePreview?.totalPrice}
            sceneNames={sceneNames}
            extraRows={[
              ...(pricePreview ? [{ label: bookingMode === 'buyout' ? '包場單價' : '每小時計價', value: `NT$ ${pricePreview.hourlyPrice.toLocaleString()}/hr` }] : []),
              ...(pricePreview ? [{ label: '場地費用', value: `NT$ ${pricePreview.studioSubtotal.toLocaleString()}` }] : []),
              ...(pricePreview && pricePreview.equipmentTotal > 0 ? [{ label: '器材租借', value: `NT$ ${pricePreview.equipmentTotal.toLocaleString()}` }] : []),
              ...(pricePreview ? [{ label: '原價', value: `NT$ ${pricePreview.subtotal.toLocaleString()}` }] : []),
              ...(appliedDiscount && pricePreview
                ? [{ label: `折扣 ${appliedDiscount.code}`, value: `- NT$ ${pricePreview.discountAmount.toLocaleString()}` }]
                : []),
            ]}
          />
        </aside>
      </div>
    </div>
  )
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  )
}

function parseSceneIds(value: string | null): ID[] {
  return value?.split(',').map(Number).filter(Number.isFinite) ?? []
}

function localDateFromIso(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function bookingRangeMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  const slotDate = localDateFromIso(startAt)
  const endDate = localDateFromIso(endAt)
  const startMinute = start.getHours() * 60 + start.getMinutes()
  const rawEndMinute = end.getHours() * 60 + end.getMinutes()
  const endMinute = endDate > slotDate || rawEndMinute <= startMinute ? 1440 : rawEndMinute
  return { startMinute, endMinute }
}
