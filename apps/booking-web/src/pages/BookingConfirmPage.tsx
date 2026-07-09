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
import { ApiError, Button, Spinner, type ID } from '@studio/shared'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { useCreateBooking } from '../hooks/useCreateBooking'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { Input, Textarea } from '../components/ui/Input'
import { BookingSummary } from '../components/Booking/BookingSummary'
import { SceneMultiSelect } from '../components/Booking/SceneMultiSelect'

const schema = z.object({
  customerName: z.string().min(2, '請輸入姓名'),
  customerPhone: z.string().min(8, '請輸入聯絡電話'),
  customerEmail: z.string().email('請輸入正確 email'),
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

  const studioIdNum = studioId ? Number(studioId) : undefined
  const { data: studio, isLoading } = useStudio(studioIdNum)
  const { data: scenes } = useScenes(studioIdNum)

  const [sceneIds, setSceneIds] = useState<ID[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const create = useCreateBooking()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    // 需求 4：預約表單要自動帶入使用者資料
    defaultValues: {
      customerName: user?.displayName ?? '',
      customerPhone: user?.phone ?? '',
      customerEmail: user?.email ?? '',
    },
  })

  const sceneNames = useMemo(
    () => scenes?.items.filter((s) => sceneIds.includes(s.id)).map((s) => s.name) ?? [],
    [scenes, sceneIds],
  )

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!studio) return <p className="py-16 text-center text-ink-2">找不到攝影棚。</p>

  if (!startAt || !endAt) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-serif text-xl text-ink">尚未選擇時段</p>
        <p className="mt-2 text-sm text-ink-2">請先回月曆選一個日期與時段。</p>
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
      const booking = await create.mutateAsync({
        studioId: studio.id,
        startAt,
        endAt,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        headcount: values.headcount,
        purpose: values.purpose || undefined,
        customerNote: values.customerNote || undefined,
        sceneIds,
      })
      nav(`/bookings/${booking.id}/success`, { replace: true })
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : '送出失敗，請稍後再試')
    }
  })

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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="姓名" htmlFor="customerName" error={errors.customerName?.message} required>
                <Input
                  id="customerName"
                  autoComplete="name"
                  invalid={!!errors.customerName}
                  {...register('customerName')}
                />
              </Field>
              <Field label="聯絡電話" htmlFor="customerPhone" error={errors.customerPhone?.message} required>
                <Input
                  id="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  invalid={!!errors.customerPhone}
                  {...register('customerPhone')}
                />
              </Field>
            </div>
            <Field label="Email" htmlFor="customerEmail" error={errors.customerEmail?.message} required>
              <Input
                id="customerEmail"
                type="email"
                autoComplete="email"
                invalid={!!errors.customerEmail}
                {...register('customerEmail')}
              />
            </Field>
            <p className="text-xs text-ink-3">
              以上資料已從你的會員檔案帶入，可視需要修改。
            </p>
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

            {scenes && scenes.items.length > 0 && (
              <Field label="預計使用的佈景" hint="可多選，也可留白到現場再決定">
                <SceneMultiSelect scenes={scenes.items} value={sceneIds} onChange={setSceneIds} />
              </Field>
            )}

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
            <Button type="submit" disabled={isSubmitting || create.isPending}>
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
            sceneNames={sceneNames}
          />
        </aside>
      </div>
    </div>
  )
}
