/**
 * BankTransferInfo — 預約完成頁顯示的匯款帳戶資訊。
 * - 提供「複製」按鈕（帳號、金額）
 * - 走 accent/moss 色系當作次要 info block，區別於中性表格
 */
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import type { BankAccount } from '@studio/shared'

interface Props {
  bankAccount: BankAccount
  amount: number
  bookingNumber: string
  amountLabel?: string
}

export function BankTransferInfo({ bankAccount, amount, bookingNumber, amountLabel = '應付金額' }: Props) {
  return (
    <div className="rounded-xl border border-line bg-accent-subtle/60 p-6">
      <h3 className="font-serif text-lg text-ink">匯款資訊</h3>
      <p className="mt-1 text-sm text-ink-2">
        請於 24 小時內完成匯款，並於「我的預約」中回報末 5 碼。
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Row label="銀行" value={`${bankAccount.bankName}（${bankAccount.bankCode}）`} />
        <Row label="分行" value={bankAccount.branchName ?? '—'} />
        <Row label="戶名" value={bankAccount.accountHolder} />
        <Row label="帳號" value={bankAccount.accountNumber} copyable />
        <Row label={amountLabel} value={`NT$ ${amount.toLocaleString()}`} copyable copyText={String(amount)} />
        <Row label="備註（訂單編號）" value={bookingNumber} copyable />
      </dl>

      <p className="mt-4 text-xs text-ink-3">
        匯款完成後，狀態會由「待付款」變為「已確認」；電子鎖密碼將於預約前一天寄至 email。
      </p>
    </div>
  )
}

function Row({ label, value, copyable, copyText }:
  { label: string; value: string; copyable?: boolean; copyText?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(copyText ?? value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-2 text-ink">
        <span className="truncate">{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={copy}
            className="rounded-md p-1 text-ink-3 hover:bg-surface hover:text-ink"
            aria-label={`複製${label}`}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          </button>
        )}
      </dd>
    </div>
  )
}
