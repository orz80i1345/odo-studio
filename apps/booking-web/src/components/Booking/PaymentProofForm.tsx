import { useState, type FormEvent } from 'react'
import type { Booking, BookingPaymentProof, Payment } from '@studio/shared'
import { useSubmitPaymentProof } from '../../hooks/useCreateBooking'

interface PaymentProofFormProps {
  booking: Booking
  payment?: Payment
}

export function PaymentProofForm({ booking, payment }: PaymentProofFormProps) {
  const submitProof = useSubmitPaymentProof()
  const [message, setMessage] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const proof = paymentProofFromPayment(payment, booking.metadata)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const bankLast4 = String(form.get('bankLast4') ?? '').trim()
    if (!/^\d{4}$/.test(bankLast4)) {
      setMessage('請輸入匯款帳號末四碼')
      return
    }

    const paidAtValue = String(form.get('paidAt') ?? '').trim()
    const paidAt = new Date(paidAtValue)
    if (!paidAtValue || Number.isNaN(paidAt.getTime())) {
      setMessage('請輸入正確的匯款時間')
      return
    }

    try {
      setMessage(null)
      await submitProof.mutateAsync({
        booking,
        proof: {
          bankLast4,
          payerName: String(form.get('payerName') ?? '').trim() || undefined,
          paidAt: paidAt.toISOString(),
          paymentNote: String(form.get('paymentNote') ?? '').trim() || undefined,
        },
      })
      setSubmitted(true)
      setMessage('匯款資訊已送出，我們會在確認入帳後更新付款狀態。')
    } catch (error) {
      setSubmitted(false)
      setMessage(error instanceof Error ? error.message : '匯款資訊送出失敗，請稍後再試')
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-surface p-6">
      <h3 className="font-serif text-lg text-ink">回報匯款資訊</h3>
      <p className="mt-1 text-sm text-ink-2">完成匯款後請填寫以下資料，方便我們核對入帳。</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-2">帳號末四碼</span>
          <input
            name="bankLast4"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required
            defaultValue={proof.bankLast4 ?? ''}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-sunken px-3 text-ink outline-none focus:border-brand"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-2">匯款人姓名</span>
          <input
            name="payerName"
            defaultValue={proof.payerName ?? booking.customerName}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-sunken px-3 text-ink outline-none focus:border-brand"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-2">匯款時間</span>
          <input
            name="paidAt"
            type="datetime-local"
            required
            defaultValue={toDateTimeLocal(proof.paidAt)}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-sunken px-3 text-ink outline-none focus:border-brand"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-ink-2">備註</span>
          <textarea
            name="paymentNote"
            defaultValue={proof.paymentNote ?? ''}
            className="mt-1 min-h-24 w-full resize-none rounded-lg border border-line bg-sunken px-3 py-2 text-ink outline-none focus:border-brand"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className={submitted ? 'text-sm text-success' : 'text-sm text-ink-2'} aria-live="polite">
          {message}
        </p>
        <button
          type="submit"
          disabled={submitProof.isPending}
          className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-on hover:bg-brand-hover disabled:opacity-50"
        >
          {submitProof.isPending ? '送出中…' : payment ? '更新匯款資訊' : '送出匯款資訊'}
        </button>
      </div>
    </form>
  )
}

function paymentProofFromPayment(payment: Payment | undefined, metadata: Record<string, unknown>): BookingPaymentProof {
  if (payment) {
    return {
      bankLast4: payment.payerLast4,
      payerName: payment.payerName,
      paidAt: payment.transferredAt,
      paymentNote: typeof payment.metadata.customerPaymentNote === 'string'
        ? payment.metadata.customerPaymentNote
        : undefined,
    }
  }

  const value = metadata.paymentProof
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const proof = value as Record<string, unknown>
  return {
    ...proof,
    bankLast4: typeof proof.bankLast4 === 'string'
      ? proof.bankLast4
      : typeof proof.bankLast5 === 'string'
        ? proof.bankLast5.slice(-4)
        : undefined,
  } as BookingPaymentProof
}

function toDateTimeLocal(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}
