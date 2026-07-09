import { Spinner } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { StudioCard } from '../components/Studio/StudioCard'
import { useStudios } from '../hooks/useStudios'

export function StudiosPage() {
  const { data, isLoading } = useStudios()
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Space"
        title="空間介紹"
        subtitle="兩間性格不同的攝影棚：一間偏室內、光線柔軟；一間半戶外、光影劇烈。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div className="grid gap-6 md:grid-cols-2">
        {data?.items.map((s) => <StudioCard key={s.id} studio={s} />)}
      </div>
    </div>
  )
}
