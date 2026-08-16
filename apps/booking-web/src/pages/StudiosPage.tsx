import { Spinner } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { StudioCard } from '../components/Studio/StudioCard'
import { useStudios } from '../hooks/useStudios'

export function StudiosPage() {
  const { data, isLoading } = useStudios()
  return (
    <div className="space-y-16 md:space-y-24">
      <PageHeader
        eyebrow="01 / Space"
        title="空間介紹"
        subtitle="以自然光、材質與留白構成的拍攝空間。畫面不急著被填滿，光線會替作品留下呼吸。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div className="grid gap-14 md:grid-cols-2 md:gap-20">
        {data?.items.map((s) => <StudioCard key={s.id} studio={s} />)}
      </div>
    </div>
  )
}
