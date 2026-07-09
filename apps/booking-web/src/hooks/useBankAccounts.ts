import { useQuery } from '@tanstack/react-query'
import { queryKeys, bankAccountsApi } from '@studio/shared'
import { api } from '../lib'

export function useActiveBankAccounts() {
  return useQuery({
    queryKey: queryKeys.bankAccounts.active,
    queryFn: () => bankAccountsApi.listActiveBankAccounts(api),
  })
}
