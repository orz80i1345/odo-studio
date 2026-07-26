/**
 * bank.ts
 * 收款銀行帳戶（前台結帳頁顯示用）。對應 schema 的 bank_accounts。
 */
import type { ID } from './common'

export interface BankAccount {
  id: ID
  bankName: string
  bankCode: string
  branchName?: string
  branchCode?: string
  accountNumber: string
  accountHolder: string
  displayName?: string
  isDefault: boolean
}
