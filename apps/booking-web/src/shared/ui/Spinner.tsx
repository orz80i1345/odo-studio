/**
 * Spinner.tsx
 * 簡單的載入指示器，供 TanStack Query isLoading 狀態使用。
 */
import { cn } from '../utils/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="載入中"
      className={cn(
        'inline-block size-5 animate-spin rounded-full',
        'border-2 border-line-strong border-t-brand',
        className,
      )}
    />
  )
}
