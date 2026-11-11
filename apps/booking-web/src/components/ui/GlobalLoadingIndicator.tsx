import { useEffect, useState, useSyncExternalStore } from 'react'
import { Spinner } from '@studio/shared'
import { getNetworkActivitySnapshot, subscribeToNetworkActivity } from '../../networkActivity'

const SHOW_DELAY_MS = 140

export function GlobalLoadingIndicator() {
  const active = useSyncExternalStore(
    subscribeToNetworkActivity,
    getNetworkActivitySnapshot,
    () => false,
  )
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }

    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [active])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={[
        'pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-brand/15">
        <div className="network-loading-bar h-full w-1/2 rounded-full bg-brand" />
      </div>
      <div className="absolute bottom-5 right-5 flex items-center gap-2.5 rounded-full border border-line bg-surface/95 px-4 py-2.5 text-sm text-ink-2 shadow-raised backdrop-blur-md">
        <Spinner className="size-4" />
        <span>資料載入中…</span>
      </div>
    </div>
  )
}
