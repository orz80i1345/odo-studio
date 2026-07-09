/**
 * BookingSuccessPage — 預約完成 / 待付款
 *
 * 路徑：/bookings/:bookingId/success
 *
 * 呈現：
 *  - 「已建立預約，狀態為待付款」的訊息
 *  - BookingSummary（訂單摘要）
 *  - BankTransferInfo（匯款帳號 + 訂金金額 + 訂單編號）
 *  - CTA：回到我的預約 / 再訂一個時段
 */
import { Link, useParams } from 'react-router'
import { Check } from 'lucide-react'
import { Spinner } from '@studio/shared'
import { useBooking } from '../hooks/useMyBookings'
import { useStudio } from '../hooks/useStudios'
import { useScenes } from '../hooks/useScenes'
import { useActiveBankAccounts } from '../hooks/useBankAccounts'
import { BookingSummary } from '../components/Booking/BookingSummary'
import { BankTransferInfo } from '../components/Booking/BankTransferInfo'
import { BookingStatusBadge } from '../components/Booking/BookingStatusBadge'

export function BookingSuccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const bookingIdNum = bookingId ? Number(bookingId) : undefined

  const { data: booking, isLoading } = useBooking(bookingIdNum)
  const { data: studio } = useStudio(booking?.studioId)
  const { data: scenes } = useScenes(booking?.studioId)
  const { data: bankAccounts } = useActiveBankAccounts()

  if (isLoading) return <div className="py-16 text-center"><Spinner /></div>
  if (!booking || !studio) return <p className="py-16 text-center text-ink-2">找不到此預約。</p>

  const sceneNames =
    scenes?.items.filter((s) => booking.sceneIds.includes(s.id)).map((s) => s.name) ?? []

  const bank = bankAccounts?.find((b) => b.isDefault) ?? bankAccounts?.[0]

  return (
    <div className="space-y-8">
      {/* 頂部橫幅：確認訊息 */}
      <header className="rounded-xl border border-line bg-brand-subtle/60 p-8">
        <div className="flex items-start gap-4">
          <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-brand text-brand-on">
            <Check className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-serif text-3xl text-ink">預約已建立</h1>
              <BookingStatusBadge booking={booking} />
            </div>
            <p className="mt-2 text-ink-2">
              訂單編號 <span className="font-medium text-ink">{booking.bookingNumber}</span>
              　·　請於 24 小時內完成訂金匯款，即可正式確認檔期。
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* 匯款資訊 */}
        <div className="min-w-0 space-y-6">
          {bank ? (
            <BankTransferInfo
              bankAccount={bank}
              amount={booking.depositAmount}
              bookingNumber={booking.bookingNumber}
            />
          ) : (
            <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-2">
              收款帳號載入中…
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/my-bookings"
              className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover"
            >
              查看我的預約
            </Link>
            <Link to="/studios" className="text-sm text-ink-2 hover:text-ink underline underline-offset-4">
              再看看其他空間 →
            </Link>
          </div>
        </div>

        {/* 側欄：訂單摘要 */}
        <aside className="h-fit">
          <BookingSummary
            studio={studio}
            startAt={booking.startAt}
            endAt={booking.endAt}
            totalPrice={booking.totalPrice}
            sceneNames={sceneNames}
            bookingNumber={booking.bookingNumber}
            extraRows={[
              { label: '訂金', value: `NT$ ${booking.depositAmount.toLocaleString()}` },
            ]}
          />
        </aside>
      </div>
    </div>
  )
}
