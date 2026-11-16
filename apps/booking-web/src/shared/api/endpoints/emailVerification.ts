interface RequestCodeResponse {
  success: boolean
  expiresIn: number
  resendAfter: number
}

interface VerifyCodeResponse {
  verified: boolean
}

interface ErrorResponse {
  message?: string
}

const endpointBase = (import.meta.env.VITE_EMAIL_VERIFICATION_BASE_URL ?? '')
  .replace(/\/$/, '')

export function requestEmailVerificationCode(email: string) {
  return post<RequestCodeResponse>('/email-verification/request', { email })
}

export function verifyEmailVerificationCode(email: string, code: string) {
  return post<VerifyCodeResponse>('/email-verification/verify', { email, code })
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(endpointBase + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json() as ErrorResponse
    throw new Error(error.message || '信箱驗證失敗，請稍後再試')
  }

  return response.json() as Promise<T>
}
