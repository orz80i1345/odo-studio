/**
 * PrivacyPage — 隱私權政策。純靜態內容（占位版本；實際條文請與法務確認）。
 */
import { PageHeader } from '../components/ui/PageHeader'

export function PrivacyPage() {
  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Privacy" title="隱私權政策" subtitle="最後更新於 2026 年 1 月。" />
      <article className="prose max-w-none space-y-8 text-ink-2">
        <Section title="1. 我們收集的資料">
          註冊會員或建立預約時，我們會收集你的姓名、聯絡電話、Email、以及必要的預約資訊（日期、時段、備註）。這些資料僅用於與你聯繫、履行預約、以及必要的財務憑證。
        </Section>
        <Section title="2. 資料使用範圍">
          除法律要求外，我們不會將你的個人資料轉交第三方。行銷通訊採選擇性訂閱制，可隨時透過信件中的取消訂閱連結退訂。
        </Section>
        <Section title="3. 資料保存">
          預約相關資料依會計法規保存 5 年。註銷會員可去除辨識性欄位（displayName / phone），但為稅務憑證保留最小必要資料。
        </Section>
        <Section title="4. Cookies">
          本站僅使用維持登入狀態必要的 cookie 與 localStorage；未使用第三方追蹤 cookie。
        </Section>
        <Section title="5. 聯絡我們">
          若對本政策有任何疑問，請寄信至 hello@ode.studio。
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
