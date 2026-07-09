import { Spinner } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { SceneCard } from '../components/Studio/SceneCard'
import { useScenes } from '../hooks/useScenes'

export function ScenesPage() {
  const { data, isLoading } = useScenes()
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Scenes"
        title="佈景展示"
        subtitle="收集所有空間裡的佈景。點進去看更多角度。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {data?.items.map((s) => <SceneCard key={s.id} scene={s} />)}
      </div>
    </div>
  )
}
