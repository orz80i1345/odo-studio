import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, API_BASE_URL } from '../lib'

type LinkState = 'initializing' | 'authorizing' | 'binding' | 'success' | 'verified' | 'error'

interface LineProfile {
  userId?: string
  displayName?: string
  pictureUrl?: string
}

export function LineLinkPage() {
  const [params] = useSearchParams()
  const bookingId = params.get('bookingId')
  const [state, setState] = useState<LinkState>('initializing')
  const [profile, setProfile] = useState<LineProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function linkLineAccount() {
      const liffId = import.meta.env.VITE_LINE_LIFF_ID?.trim()
      const linkEndpoint = import.meta.env.VITE_LINE_LINK_ENDPOINT?.trim()
      if (!liffId) throw new Error('尚未設定 VITE_LINE_LIFF_ID')

      const { default: liff } = await import('@line/liff')
      await liff.init({ liffId })
      if (cancelled) return
      if (!liff.isLoggedIn()) {
        setState('authorizing')
        liff.login({ redirectUri: window.location.href })
        return
      }

      const accessToken = liff.getAccessToken()
      if (!accessToken) throw new Error('無法取得 LINE access token，請重新開啟綁定頁。')

      setState('binding')
      const verifiedProfile = await getVerifiedLineProfile(accessToken)
      if (cancelled) return
      if (!verifiedProfile.userId) {
        throw new Error('LINE 驗證成功，但回應中沒有 userId，請確認 /line/login-profile 的回應格式。')
      }
      setProfile(verifiedProfile)

      if (!linkEndpoint) {
        setState('verified')
        return
      }

      await api.post(linkEndpoint, {
        lineAccessToken: accessToken,
        bookingId: parseBookingId(bookingId),
        source: 'booking_web',
      })
      if (!cancelled) setState('success')
    }

    linkLineAccount().catch((reason: unknown) => {
      if (cancelled) return
      setError(reason instanceof Error ? reason.message : 'LINE 綁定失敗，請稍後再試。')
      setState('error')
    })

    return () => {
      cancelled = true
    }
  }, [bookingId])

  const bookingPath = bookingId ? `/bookings/${bookingId}` : '/account'

  return (
    <div className="mx-auto max-w-xl py-10">
      <section className="rounded-xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#06c755] text-xl font-bold text-white">LINE</div>

        {(state === 'initializing' || state === 'authorizing' || state === 'binding') && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">{statusTitle(state)}</h1>
            <p className="mt-3 text-sm leading-6 text-ink-2">請保留此頁面，完成後會自動顯示結果。</p>
            <div className="mx-auto mt-6 size-6 animate-spin rounded-full border-2 border-line-strong border-t-[#06c755]" />
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">LINE 綁定資料已送出</h1>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              {profile?.displayName ? `已驗證 ${profile.displayName}。` : '已驗證 LINE 帳號。'}
              系統完成綁定後，門鎖密碼將於預約前依排程發送。
            </p>
          </>
        )}

        {state === 'verified' && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">LINE 帳號驗證成功</h1>
            <p className="mt-3 text-sm leading-6 text-warning-subtle-ink">
              {profile?.displayName ? `已辨識 ${profile.displayName}，` : ''}
              但尚未設定帳號綁定 workflow，目前還未寫入綁定資料。
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">LINE 綁定未完成</h1>
            <p className="mt-3 rounded-md bg-danger-subtle px-4 py-3 text-sm text-danger-subtle-ink">{error}</p>
          </>
        )}

        {(state === 'success' || state === 'verified' || state === 'error') && (
          <Link
            to={bookingPath}
            className="mt-7 inline-flex h-10 items-center rounded-lg border border-line px-5 text-sm text-ink-2 hover:bg-sunken hover:text-ink"
          >
            返回{bookingId ? '預約詳細' : '會員資料'}
          </Link>
        )}
      </section>
    </div>
  )
}

async function getVerifiedLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/line/login-profile`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(typeof payload.message === 'string' ? payload.message : 'LINE access token 驗證失敗')
  }
  return normalizeLineProfile(payload)
}

function normalizeLineProfile(payload: Record<string, unknown>): LineProfile {
  const data = unwrapResponse(payload)
  return {
    userId: stringValue(data.userId) ?? stringValue(data.user_id) ?? stringValue(data.sub),
    displayName: stringValue(data.displayName) ?? stringValue(data.display_name) ?? stringValue(data.name),
    pictureUrl: stringValue(data.pictureUrl) ?? stringValue(data.picture_url) ?? stringValue(data.picture),
  }
}

function unwrapResponse(payload: Record<string, unknown>): Record<string, unknown> {
  let current = payload
  for (let depth = 0; depth < 4; depth += 1) {
    const nested = objectValue(current.data) ?? objectValue(current.body)
    if (!nested) break
    current = nested
  }
  return current
}

function parseBookingId(value: string | null) {
  if (!value) return undefined
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

function objectValue(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function statusTitle(state: LinkState) {
  if (state === 'authorizing') return '正在前往 LINE 授權'
  if (state === 'binding') return '正在驗證並綁定 LINE'
  return '正在初始化 LINE'
}
