import { cn } from '@studio/shared'

interface BrandLogoProps {
  className?: string
  variant?: 'mark' | 'full'
}

/** mark 用於導覽列；full 用於網頁內的完整品牌識別。 */
export function BrandLogo({ className, variant = 'mark' }: BrandLogoProps) {
  const full = variant === 'full'

  return (
    <span
      role="img"
      aria-label="河日 Ode Studio"
      className={cn(
        'block shrink-0',
        className,
      )}
    >
      <img
        src={full
          ? '/brand/ode-studio-full-source-v3.png'
          : '/brand/ode-studio-mark-source-v3.png'}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ backgroundColor: 'transparent' }}
        className="pointer-events-none block h-auto w-full select-none"
      />
    </span>
  )
}
