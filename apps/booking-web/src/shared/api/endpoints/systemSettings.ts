import type { ApiClient } from '../client'
import { filter, toScaffoldList, type ScaffoldListResponse } from './scaffold'

interface RawSystemSetting {
  id: number
  setting_key: string
  setting_value: unknown
  value_type?: string
}

export async function getDepositRatio(api: ApiClient): Promise<number> {
  try {
    const res = await api.get<ScaffoldListResponse<RawSystemSetting>>('/public/system_settings', {
      pageSize: 1,
      filter: filter('setting_key', 'eq', 'payment.deposit_ratio'),
    })
    const setting = toScaffoldList(res, (item) => item).items[0]
    return normalizeDepositRatio(setting?.setting_value)
  } catch {
    return 1
  }
}

function normalizeDepositRatio(value: unknown): number {
  const raw = typeof value === 'string' ? Number(value) : Number(value ?? 1)
  if (!Number.isFinite(raw)) return 1
  if (raw > 1 && raw <= 100) return raw / 100
  return Math.min(Math.max(raw, 0), 1)
}
