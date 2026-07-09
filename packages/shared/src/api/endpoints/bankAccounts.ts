/**
 * endpoints/bankAccounts.ts
 * 前台結帳頁顯示的收款帳戶清單（僅 is_active + is_public）。
 */
import type { ApiClient } from '../client'
import type { BankAccount } from '../../types'

export function listActiveBankAccounts(api: ApiClient) {
  return api.get<BankAccount[]>('/bank-accounts')
}
