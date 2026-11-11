import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { customerAuthApi } from '@studio/shared'
import { authStorage } from '../auth/storage'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib'
import { withNetworkActivity } from '../networkActivity'

type LinkState = 'initializing' | 'authorizing' | 'binding' | 'success' | 'verified' | 'error'

interface LineProfile {
  userId?: string
  displayName?: string
  pictureUrl?: string
}

export function LineLinkPage() {
  const { markLineLinked } = useAuth()
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

      const liffProfile = await liff.getProfile().catch(() => null)
      const decodedIdToken = liff.getDecodedIDToken()
      const lineUserId = liffProfile?.userId ?? decodedIdToken?.sub
      const lineDisplayName = liffProfile?.displayName ?? decodedIdToken?.name
      if (cancelled) return
      if (!lineUserId) {
        throw new Error('無法取得 LINE userId，請確認 LIFF 已啟用 openid 或 profile scope 後重新授權。')
      }
      setProfile({
        userId: lineUserId,
        displayName: lineDisplayName,
        pictureUrl: liffProfile?.pictureUrl ?? decodedIdToken?.picture,
      })

      if (!linkEndpoint) {
        setState('verified')
        return
      }

      const websiteToken = authStorage.getToken()
      if (!websiteToken) throw new Error('網站登入已失效，請重新登入後再綁定 LINE。')

      const websiteUser = await customerAuthApi.getCustomerMe(api)
      if (cancelled) return
      const websiteUserId = Number(websiteUser.userId)
      if (!Number.isInteger(websiteUserId) || websiteUserId <= 0) {
        throw new Error('無法取得網站會員 ID，請重新登入後再綁定 LINE。')
      }

      setState('binding')
      await submitLineLinkRequest(linkEndpoint, {
        websiteAccessToken: websiteToken,
        userId: websiteUserId,
        lineUserId,
        lineDisplayName,
        lineAccessToken: accessToken,
        lineProfileSource: liffProfile ? 'liff_profile' : 'liff_id_token',
        lineProfileVerified: false,
        bookingId: parseBookingId(bookingId),
        source: 'booking_web',
      })
      markLineLinked()
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
  }, [bookingId, markLineLinked])

  const bookingPath = bookingId ? `/bookings/${bookingId}` : '/account'

  return (
    <div className="mx-auto max-w-xl py-10">
      <section className="rounded-xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#06c755] text-xl font-bold text-white">LINE</div>

        {(state === 'initializing' || state === 'authorizing' || state === 'binding') && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">{statusTitle(state)}</h1>
            <p className="mt-3 text-sm leading-6 text-ink-2">{statusDescription(state)}</p>
            <div role="status" aria-live="polite" className="mt-7 flex flex-col items-center">
              <div className="relative size-16" aria-hidden="true">
                <div className="absolute inset-0 rounded-full border-2 border-[#06c755]/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-[#06c755] border-t-[#06c755] motion-reduce:animate-none" />
                <div className="absolute inset-3 animate-pulse rounded-full bg-[#06c755]/15 motion-reduce:animate-none" />
                <div className="absolute inset-[1.35rem] rounded-full bg-[#06c755]" />
              </div>
              <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
                <span className="size-1.5 animate-pulse rounded-full bg-[#06c755] motion-reduce:animate-none" />
                <span className="size-1.5 animate-pulse rounded-full bg-[#06c755] [animation-delay:180ms] motion-reduce:animate-none" />
                <span className="size-1.5 animate-pulse rounded-full bg-[#06c755] [animation-delay:360ms] motion-reduce:animate-none" />
              </div>
              <span className="sr-only">處理中，請稍候</span>
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">LINE 帳號已綁定</h1>
            <p className="mt-3 text-sm leading-6 text-ink-2">
              {profile?.displayName ? `已驗證 ${profile.displayName}。` : '已驗證 LINE 帳號。'}
              門鎖密碼將於預約前依排程發送。
            </p>
          </>
        )}

        {state === 'verified' && (
          <>
            <h1 className="mt-6 font-serif text-2xl text-ink">LINE 授權成功</h1>
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

async function submitLineLinkRequest(linkEndpoint: string, payload: Record<string, unknown>) {
  if (!/^https?:\/\//i.test(linkEndpoint)) {
    await api.post(linkEndpoint, payload)
    return
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const websiteToken = authStorage.getToken()
  if (websiteToken) headers.Authorization = `Bearer ${websiteToken}`

  await withNetworkActivity(async () => {
    const response = await fetch(linkEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const message = await response.text().catch(() => '')
      throw new Error(message || `LINE 綁定 endpoint 回傳 HTTP ${response.status}`)
    }
  })
}

function parseBookingId(value: string | null) {
  if (!value) return undefined
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

function statusTitle(state: LinkState) {
  if (state === 'authorizing') return '正在前往 LINE 授權'
  if (state === 'binding') return '正在綁定 LINE 帳號'
  return '正在初始化 LINE'
}

function statusDescription(state: LinkState) {
  if (state === 'binding') return '正在等待系統完成綁定，請勿關閉或重新整理此頁面。'
  if (state === 'authorizing') return '即將開啟 LINE 授權，完成後會自動返回。'
  return '正在準備 LINE 服務，請稍候。'
}
