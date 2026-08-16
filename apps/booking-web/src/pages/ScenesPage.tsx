import { Spinner } from '@studio/shared'
import { PageHeader } from '../components/ui/PageHeader'
import { SceneCard } from '../components/Studio/SceneCard'
import { useScenes } from '../hooks/useScenes'

export function ScenesPage() {
  const { data, isLoading } = useScenes()
  return (
    <div className="space-y-16 md:space-y-24">
      <PageHeader
        eyebrow="02 / Scenes"
        title="佈景展示"
        subtitle="每個佈景保留不同的光線、材質與比例。預約時可以選擇單一佈景，或選擇包場保留整個空間。"
      />
      {isLoading && <div className="py-16 text-center"><Spinner /></div>}
      <div className="grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((s) => <SceneCard key={s.id} scene={s} />)}
      </div>
    </div>
  )
}
