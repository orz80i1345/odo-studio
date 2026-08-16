/**
 * TermsPage — 使用條款。純靜態內容（占位版本）。
 */
import { PageHeader } from '../components/ui/PageHeader'

export function TermsPage() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Terms" title="使用條款" subtitle="最後更新於 2026 年 1 月。" />
      <article className="prose max-w-none space-y-8 text-ink-2">
        <Section title="1. 預約與付款">
          預約送出後需完成全額付款；逾時未付款者，系統將自動取消預約並釋出時段。付款方式依預約頁與後續通知為準。
        </Section>
        <Section title="2. 取消與退款">
          預約 7 天前取消可全額退款；7 天內取消退還 50%；24 小時內取消或未到，不予退款。天災與不可抗力事件將個案處理。
        </Section>
        <Section title="3. 場地使用">
          請愛惜場地與器材。造成損壞需依實際維修費用賠償。禁止吸菸、明火與需污染性溶劑作業。抽菸與電子煙皆為禁止行為。
        </Section>
        <Section title="4. 內容與版權">
          於場地內拍攝的作品版權歸拍攝者所有。若使用本場地作品參與商業拍攝並公開發佈，歡迎（非強制）標註 @odestudio。
        </Section>
        <Section title="5. 準則與清潔">
          場地為共享空間，請於離場前恢復原狀：垃圾自行帶走、傢俱歸位、地板無明顯髒污。清潔費以實際狀況酌收。
        </Section>
        <Section title="6. 修訂條款">
          我們保留隨時修訂本條款的權利；修訂後將於本頁公告，自公告日起生效。
        </Section>
      </article>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <p className="mt-3 leading-relaxed">{children}</p>
    </section>
  )
}
