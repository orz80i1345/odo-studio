/**
 * BookingDetailPage — 預約詳細
 *
 * 路徑：/bookings/:bookingId
 *
 * 顯示 booking 全部資訊 + 匯款資訊（若尚未付款）+ 取消按鈕（若狀態允許）。
 * 取消採 confirm() 二次確認；成功後導回列表。
 */
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, Spinner, isPendingPayment, type BookingPaymentProof } from '@studio/shared'
import { useBooking } from '../hooks/useMyBookings'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { useCancelBooking, useSubmitPaymentProof } from '../hooks/useCreateBooking'
import { useActiveBankAccounts } from '../hooks/useBankAccounts'
import { useBookingEquipment } from '../hooks/useEquipment'
import { PageHeader } from '../components/ui/PageHeader'
import { BookingSummary } from '../components/Booking/BookingSummary'
import { BankTransferInfo } from '../components/Booking/BankTransferInfo'
import { BookingStatusBadge } from '../components/Booking/BookingStatusBadge'
import { PaymentStatusBadge } from '../components/Booking/PaymentStatusBadge'
import { useAuth } from '../auth/AuthContext'

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const nav = useNavigate()
  const bookingIdNum = bookingId ? Number(bookingId) : undefined
  const { user } = useAuth()

  const { data: booking, isLoading } = useBooking(bookingIdNum)
  const { data: studio } = useStudio(booking?.studioId)
  const { data: scenes } = useScenes(booking?.studioId)
  const { data: bankAccounts } = useActiveBankAccounts()
  const { data: bookingEquipment } = useBookingEquipment(bookingIdNum)
  const cancel = useCancelBooking()
  const submitProof = useSubmitPaymentProof()
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!booking || !studio) return <p className="py-16 text-center text-ink-2">找不到此預約。</p>
  if (booking.customerEmail !== user?.email) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-serif text-xl text-ink">無法查看此預約</p>
        <p className="mt-2 text-sm text-ink-2">請確認你使用的是建立此預約的會員帳號。</p>
        <Link
          to="/my-bookings"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover"
        >
          回我的預約
        </Link>
      </div>
    )
  }

  const sceneNames =
    scenes?.items.filter((s) => booking.sceneIds.includes(s.id)).map((s) => s.name) ?? []
  const equipmentNames = bookingEquipment?.map((item) => item.name) ?? []
  const equipmentTotal = bookingEquipment?.reduce((sum, item) => sum + item.subtotal, 0) ?? 0

  const bank = bankAccounts?.find((b) => b.isDefault) ?? bankAccounts?.[0]
  const showBankInfo = isPendingPayment(booking)
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'
  const paymentLabel = booking.depositAmount >= booking.totalPrice ? '應付全額' : '訂金'
  const paymentProof = paymentProofFromMetadata(booking.metadata)

  async function onCancel() {
    if (!bookingIdNum) return
    if (!confirm(`確定要取消預約 ${booking!.bookingNumber} 嗎？此動作無法還原。`)) return
    try {
      setCancelError(null)
      await cancel.mutateAsync({ id: bookingIdNum, reason: 'customer_request' })
      nav('/my-bookings', { replace: true })
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : '取消失敗，請稍後再試')
    }
  }

  async function onSubmitPaymentProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const bankLast5 = String(form.get('bankLast5') ?? '').trim()
    if (!/^\d{5}$/.test(bankLast5)) {
      setPaymentMessage('請輸入匯款帳號後五碼')
      return
    }
    try {
      setPaymentMessage(null)
      if (!booking) throw new Error('找不到此預約')
      await submitProof.mutateAsync({
        booking,
        proof: {
          bankLast5,
          payerName: String(form.get('payerName') ?? '').trim() || undefined,
          paidAt: String(form.get('paidAt') ?? '').trim() || undefined,
          paymentNote: String(form.get('paymentNote') ?? '').trim() || undefined,
        },
      })
      setPaymentMessage('匯款資訊已送出')
    } catch (e) {
      setPaymentMessage(e instanceof ApiError ? e.message : '匯款資訊送出失敗，請稍後再試')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Booking · ${booking.bookingNumber}`}
        title={studio.name}
        subtitle={`建立於 ${new Date(booking.createdAt).toLocaleString('zh-TW')}`}
        actions={
          <Link to="/my-bookings" className="text-sm text-ink-2 hover:text-ink">
            ← 回列表
          </Link>
        }
      />

      {/* 狀態列 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-5 py-4">
        <span className="text-xs uppercase tracking-[0.2em] text-ink-3">目前狀態</span>
        <BookingStatusBadge booking={booking} />
        <PaymentStatusBadge status={booking.paymentStatus} />
        {booking.confirmedAt && (
          <span className="ml-auto text-xs text-ink-3">
            確認於 {new Date(booking.confirmedAt).toLocaleString('zh-TW')}
          </span>
        )}
        {booking.cancelledAt && (
          <span className="ml-auto text-xs text-danger">
            取消於 {new Date(booking.cancelledAt).toLocaleString('zh-TW')}
          </span>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {/* 匯款資訊（僅未付款時顯示） */}
          {showBankInfo && bank && (
            <BankTransferInfo
              bankAccount={bank}
              amount={booking.depositAmount}
              amountLabel={paymentLabel}
              bookingNumber={booking.bookingNumber}
            />
          )}

          {showBankInfo && (
            <form onSubmit={onSubmitPaymentProof} className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-serif text-lg text-ink">回報匯款資訊</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-ink-2">帳號後五碼</span>
                  <input
                    name="bankLast5"
                    inputMode="numeric"
                    pattern="\d{5}"
                    maxLength={5}
                    required
                    defaultValue={paymentProof.bankLast5 ?? ''}
                    className="mt-1 h-11 w-full rounded-lg border border-line bg-sunken px-3 text-ink outline-none focus:border-brand"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-2">匯款人姓名</span>
                  <input
                    name="payerName"
                    defaultValue={paymentProof.payerName ?? ''}
                    className="mt-1 h-11 w-full rounded-lg border border-line bg-sunken px-3 text-ink outline-none focus:border-brand"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-2">匯款時間</span>
                  <input
                    name="paidAt"
                    type="datetime-local"
                    defaultValue={paymentProof.paidAt?.slice(0, 16) ?? ''}
                    className="mt-1 h-11 w-full rounded-lg border border-line bg-sunken px-3 text-ink outline-none focus:border-brand"
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-ink-2">備註</span>
                  <textarea
                    name="paymentNote"
                    defaultValue={paymentProof.paymentNote ?? ''}
                    className="mt-1 min-h-24 w-full resize-none rounded-lg border border-line bg-sunken px-3 py-2 text-ink outline-none focus:border-brand"
                  />
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-ink-2">{paymentMessage}</p>
                <button
                  type="submit"
                  disabled={submitProof.isPending}
                  className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover disabled:opacity-50"
                >
                  {submitProof.isPending ? '送出中…' : '送出匯款資訊'}
                </button>
              </div>
            </form>
          )}

          {/* 客戶備註 */}
          {booking.customerNote && (
            <section className="rounded-xl border border-line bg-surface p-6">
              <h3 className="font-serif text-lg text-ink">你的備註</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{booking.customerNote}</p>
            </section>
          )}

          {/* 聯絡資訊回顧 */}
          <section className="rounded-xl border border-line bg-surface p-6">
            <h3 className="font-serif text-lg text-ink">聯絡資料</h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Row label="姓名" value={booking.customerName} />
              <Row label="電話" value={booking.customerPhone} />
              <Row label="Email" value={booking.customerEmail} />
              {booking.headcount != null && <Row label="人數" value={`${booking.headcount} 人`} />}
              {booking.purpose && <Row label="用途" value={booking.purpose} />}
            </dl>
          </section>

          {cancelError && (
            <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">
              {cancelError}
            </p>
          )}

          {/* 動作區 */}
          {canCancel && (
            <div className="flex items-center justify-between rounded-xl border border-danger/40 bg-danger-subtle/40 p-6">
              <div>
                <p className="font-serif text-lg text-ink">取消預約</p>
                <p className="mt-1 text-sm text-ink-2">
                  取消後將無法還原；7 天前全額退款，7 天內退 50%，24 小時內不予退款。
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={cancel.isPending}
                className="inline-flex h-10 items-center rounded-lg border border-danger bg-surface px-5 text-sm font-medium text-danger hover:bg-danger hover:text-brand-on disabled:opacity-50"
              >
                {cancel.isPending ? '處理中…' : '取消預約'}
              </button>
            </div>
          )}
        </div>

        {/* 側欄摘要 */}
        <aside className="h-fit">
          <BookingSummary
            studio={studio}
            startAt={booking.startAt}
            endAt={booking.endAt}
            totalPrice={booking.totalPrice}
            sceneNames={sceneNames}
            bookingNumber={booking.bookingNumber}
            extraRows={[
              ...(equipmentNames.length > 0 ? [{ label: '器材', value: equipmentNames.join('、') }] : []),
              ...(equipmentTotal > 0 ? [{ label: '器材租借', value: `NT$ ${equipmentTotal.toLocaleString()}` }] : []),
              { label: paymentLabel, value: `NT$ ${booking.depositAmount.toLocaleString()}` },
            ]}
          />
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-ink">{value}</dd>
    </div>
  )
}

function paymentProofFromMetadata(metadata: Record<string, unknown>): BookingPaymentProof {
  const value = metadata.paymentProof
  return value && typeof value === 'object' && !Array.isArray(value) ? value as BookingPaymentProof : {}
}
