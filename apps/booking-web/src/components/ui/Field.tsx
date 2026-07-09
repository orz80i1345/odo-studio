/**
 * Field — 表單標籤 + 輸入區 + 錯誤訊息 + 幫助文字。
 * 純結構元件；輸入本體由外部傳入（type-safe）。
 */
import type { ReactNode } from 'react'
import { cn } from '@studio/shared'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm text-ink-2">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  )
}
