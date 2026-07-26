/**
 * cn.ts
 * className 合併工具（clsx 的 re-export，之後若要加 tailwind-merge 只需改這裡）。
 */
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
