/**
 * endpoints/bankAccounts.ts
 * 前台結帳頁顯示的收款帳戶清單（僅 is_active + is_public）。
 */
import type { ApiClient } from '../client'
import type { BankAccount } from '../../types'
import { filter, toBankAccount, toScaffoldList, type RawBankAccount, type ScaffoldListResponse } from './scaffold'

export async function listActiveBankAccounts(api: ApiClient) {
  const res = await api.get<ScaffoldListResponse<RawBankAccount>>('/public/bank_accounts', {
    pageSize: 20,
    filter: filter('is_active', 'eq', true),
    sort: 'display_order',
  })
  return toScaffoldList(res, toBankAccount).items satisfies BankAccount[]
}
