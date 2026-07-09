/**
 * Input — 走 theme 語意 token；error 狀態視覺與 THEME.md 對應。
 */
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@studio/shared'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest }, ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full rounded-lg bg-surface px-3 py-2 text-sm text-ink',
        'border border-line hover:border-line-strong',
        'placeholder:text-ink-3',
        'focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none',
        'disabled:bg-sunken disabled:text-ink-3 disabled:cursor-not-allowed',
        invalid && 'border-danger focus:border-danger focus:ring-danger/25',
        className,
      )}
      {...rest}
    />
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, ...rest }, ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'block w-full rounded-lg bg-surface px-3 py-2 text-sm text-ink',
        'border border-line hover:border-line-strong',
        'placeholder:text-ink-3 min-h-[6rem]',
        'focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none',
        invalid && 'border-danger focus:border-danger focus:ring-danger/25',
        className,
      )}
      {...rest}
    />
  )
})
