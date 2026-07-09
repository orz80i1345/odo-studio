/**
 * Button.tsx
 * 共用按鈕元件。色彩全走 theme.css 的語意 token，
 * 不直接引用色階（例：bg-brand 而非 bg-clay-700）；light/dark 自動反轉。
 */
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

/** variant → 語意 token 對照。focus ring 由全域樣式處理，這裡不重覆設定。 */
const variantClass: Record<Variant, string> = {
  primary:
    'bg-brand text-brand-on hover:bg-brand-hover active:bg-brand-active ' +
    'disabled:bg-neutral-200 disabled:text-ink-3',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-sunken ' +
    'disabled:text-ink-3',
  ghost:
    'bg-transparent text-ink hover:bg-sunken ' +
    'disabled:text-ink-3',
  danger:
    'bg-danger text-ink-on hover:bg-persimmon-800 dark:hover:bg-persimmon-500 ' +
    'disabled:bg-neutral-200 disabled:text-ink-3',
  link:
    'bg-transparent text-brand hover:text-brand-hover underline underline-offset-4 ' +
    'px-0 h-auto disabled:text-ink-3',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    />
  )
}
