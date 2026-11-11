/**
 * ContactPage — 聯絡資訊。純靜態內容。
 */
import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'

export function ContactPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Contact"
        title="聯絡資訊"
        subtitle="工作時間為每週二至週日 10:00–19:00。週一為棚務整理日，僅回覆信件。"
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card icon={<Mail className="size-5" />} title="Email" content="odestudio.co@gmail.com" href="mailto:odestudio.co@gmail.com" />
        <Card icon={<MessageCircle className="size-5" />} title="LINE 官方帳號" content="@odestudio" href="https://line.me/R/ti/p/@odestudio" />
        <Card
          icon={<MapPin className="size-5" />}
          title="地址"
          content="新北市三重區河邊北街60-1號2樓"
          className="md:col-span-2"
        />
      </div>
      <div className="rounded-xl border border-line bg-brand-subtle/50 p-6 text-sm text-brand-subtle-ink">
        我們回信通常在 1 個工作日內完成。時間敏感的案子（如當週檔期）建議直接 LINE 私訊會比較快。
      </div>
    </div>
  )
}

function Card({ icon, title, content, href, className = '' }: {
  icon: React.ReactNode
  title: string
  content: string
  href?: string
  className?: string
}) {
  const inner = (
    <div className="flex items-start gap-4 rounded-xl border border-line bg-surface p-6 transition-colors hover:bg-sunken/40">
      <span className="mt-0.5 grid size-10 place-items-center rounded-full bg-brand-subtle text-brand-subtle-ink">
        {icon}
      </span>
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-3">{title}</div>
        <div className="mt-1 text-ink">{content}</div>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={`block ${className}`}>{inner}</a>
  ) : (
    <div className={className}>{inner}</div>
  )
}
