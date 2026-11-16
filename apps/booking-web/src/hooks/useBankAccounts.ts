import { useQuery } from '@tanstack/react-query'
import { queryKeys, bankAccountsApi } from '@studio/shared'
import { api } from '../lib'
import { configurationQueryPolicy } from '../queryPolicy'

export function useActiveBankAccounts() {
  return useQuery({
    queryKey: queryKeys.bankAccounts.active,
    queryFn: () => bankAccountsApi.listActiveBankAccounts(api),
    ...configurationQueryPolicy,
  })
}
