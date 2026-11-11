/**
 * BookingDetailPage — 預約詳細
 *
 * 路徑：/bookings/:bookingId
 *
 * 顯示 booking 全部資訊 + 匯款資訊（若尚未付款）+ 取消按鈕（若狀態允許）。
 * 取消採 confirm() 二次確認；成功後導回列表。
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, Spinner, isPendingPayment } from '@studio/shared'
import { useBooking } from '../hooks/useMyBookings'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { useCancelBooking } from '../hooks/useCreateBooking'
import { useActiveBankAccounts } from '../hooks/useBankAccounts'
import { useBookingEquipment } from '../hooks/useEquipment'
import { useBookingPayments } from '../hooks/usePayments'
import { PageHeader } from '../components/ui/PageHeader'
import { BookingSummary } from '../components/Booking/BookingSummary'
import { BankTransferInfo } from '../components/Booking/BankTransferInfo'
import { BookingStatusBadge } from '../components/Booking/BookingStatusBadge'
import { PaymentStatusBadge } from '../components/Booking/PaymentStatusBadge'
import { PaymentProofForm } from '../components/Booking/PaymentProofForm'
import { useAuth } from '../auth/AuthContext'

export function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const nav = useNavigate()
  const bookingIdNum = bookingId ? Number(bookingId) : undefined
  const { user } = useAuth()

  const { data: booking, isLoading } = useBooking(bookingIdNum)
  const { data: payments, isLoading: isLoadingPayments } = useBookingPayments(bookingIdNum)
  const { data: studio } = useStudio(booking?.studioId)
  const { data: scenes } = useScenes(booking?.studioId)
  const { data: bankAccounts } = useActiveBankAccounts()
  const { data: bookingEquipment } = useBookingEquipment(bookingIdNum)
  const cancel = useCancelBooking()
  const [cancelError, setCancelError] = useState<string | null>(null)

  if (isLoading || isLoadingPayments) return <div className="py-16 text-center"><Spinner /></div>
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
  const showLineStatus = booking.status === 'confirmed' && booking.paymentStatus === 'paid'
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'
  const hasBookingStarted = new Date(booking.startAt).getTime() <= Date.now()
  const paymentLabel = booking.depositAmount >= booking.totalPrice ? '應付全額' : '訂金'
  const payment = payments?.find((item) => item.status === 'pending' || item.status === 'failed') ?? payments?.[0]
  const contactName = booking.customerName.trim().toLocaleLowerCase() === booking.customerEmail.trim().toLocaleLowerCase()
    ? user?.displayName ?? '尚未設定'
    : booking.customerName

  async function onCancel() {
    if (!bookingIdNum || hasBookingStarted) return
    if (!confirm(`確定要取消預約 ${booking!.bookingNumber} 嗎？此動作無法還原。`)) return
    try {
      setCancelError(null)
      await cancel.mutateAsync({ id: bookingIdNum, reason: 'customer_request' })
      nav('/my-bookings', { replace: true })
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : '取消失敗，請稍後再試')
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
            <PaymentProofForm booking={booking} payment={payment} />
          )}

          {showLineStatus && (
            <section className="rounded-xl border border-[#06c755]/40 bg-[#06c755]/10 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-ink-3">LINE Notification</p>
              <h3 className="mt-2 font-serif text-xl text-ink">
                {user?.lineStatus ? 'LINE 帳號已綁定' : '用 LINE 接收門鎖密碼'}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">
                {user?.lineStatus
                  ? '已完成 LINE 綁定，門鎖密碼將於預約前依排程發送。'
                  : '綁定後，門鎖密碼將於預約前依排程傳送至 LINE；若 LINE 無法傳送，仍會以 Email 通知。'}
              </p>
              {!user?.lineStatus && (
                <Link
                  to={`/line/link?bookingId=${booking.id}`}
                  className="mt-5 inline-flex h-11 items-center rounded-lg bg-[#06c755] px-5 text-sm font-medium text-white hover:bg-[#05b64d]"
                >
                  綁定 LINE 帳號
                </Link>
              )}
            </section>
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
              <Row label="姓名" value={contactName} />
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
                  {hasBookingStarted
                    ? '預約時段已開始或已結束，無法再從網站取消。'
                    : '取消後將無法還原；7 天前全額退款，7 天內退 50%，24 小時內不予退款。'}
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={cancel.isPending || hasBookingStarted}
                className="inline-flex h-10 items-center rounded-lg border border-danger bg-surface px-5 text-sm font-medium text-danger hover:bg-danger hover:text-brand-on disabled:cursor-not-allowed disabled:border-line disabled:bg-sunken disabled:text-ink-3 disabled:opacity-70"
              >
                {cancel.isPending ? '處理中…' : hasBookingStarted ? '已超過取消時間' : '取消預約'}
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
