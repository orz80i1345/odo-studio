/**
 * FAQPage — 常見問題。純靜態內容。
 */
import { PageHeader } from '../components/ui/PageHeader'

const faqs: { q: string; a: string }[] = [
  {
    q: '如何預約？',
    a: '選擇空間 → 挑選日期與時段 → 填寫聯絡資料 → 收到匯款資訊。訂金匯款後我們會於一個工作日內確認。',
  },
  {
    q: '需要押金嗎？',
    a: '需先繳交總金額的 30% 作為訂金，尾款可於當日抵達時以現金或信用卡支付。',
  },
  {
    q: '取消政策為何？',
    a: '預約前 48 小時以外取消可全額退還訂金；48 小時內取消，訂金不予退還。',
  },
  {
    q: '可以自備道具或器材嗎？',
    a: '可以。請於備註中告知我們大型器材需求，方便我們預留電源與空間。',
  },
  {
    q: '寵物可以入場嗎？',
    a: '可以，但請自備寵物墊與清潔用品，離場前請恢復原狀。',
  },
  {
    q: '是否提供停車？',
    a: '大樓地下室有付費停車場，僅需臨停者建議搭乘捷運或計程車前往。',
  },
]

export function FAQPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Help"
        title="常見問題"
        subtitle="沒有找到答案？可以到「聯絡資訊」頁直接寫信給我們。"
      />
      <div className="divide-y divide-line rounded-xl border border-line bg-surface">
        {faqs.map((f) => (
          <details key={f.q} className="group p-6">
            <summary className="cursor-pointer list-none font-serif text-lg text-ink flex items-center justify-between">
              <span>{f.q}</span>
              <span className="ml-4 text-ink-3 transition-transform group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-ink-2">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
