import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError, Button } from '@studio/shared'
import { useAuth } from '../auth/AuthContext'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import {
  requestEmailVerificationCode,
  verifyEmailVerificationCode,
} from '../shared/api/endpoints/emailVerification'
import { useEffect, useState } from 'react'

const schema = z.object({
  displayName: z.string().min(2, '請輸入姓名'),
  email: z.string().email('請輸入正確 email'),
  phone: z.string().min(8, '請輸入正確電話'),
  password: z.string().min(6, '密碼至少 6 字'),
  marketingOptIn: z.boolean().optional(),
})
type Form = z.infer<typeof schema>

export function RegisterPage() {
  const { register: doRegister } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/'
  const [serverError, setServerError] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const email = watch('email') ?? ''
  const normalizedEmail = normalizeEmail(email)
  const isEmailVerified = verifiedEmail === normalizedEmail && !!normalizedEmail

  useEffect(() => {
    if (!resendCountdown) return
    const timer = window.setInterval(() => {
      setResendCountdown((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendCountdown])

  useEffect(() => {
    if (verifiedEmail && verifiedEmail !== normalizedEmail) setVerifiedEmail(null)
    if (codeSentTo && codeSentTo !== normalizedEmail) {
      setCodeSentTo(null)
      setVerificationCode('')
      setVerificationError(null)
      setResendCountdown(0)
    }
  }, [codeSentTo, normalizedEmail, verifiedEmail])

  const sendVerificationCode = async () => {
    const valid = await trigger('email')
    if (!valid) return

    setIsSendingCode(true)
    setVerificationError(null)
    try {
      const result = await requestEmailVerificationCode(getValues('email'))
      setCodeSentTo(normalizedEmail)
      setVerificationCode('')
      setResendCountdown(result.resendAfter)
    } catch (error) {
      setVerificationError(errorMessage(error, '驗證信寄送失敗，請稍後再試'))
    } finally {
      setIsSendingCode(false)
    }
  }

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationError('請輸入六位數驗證碼')
      return
    }

    setIsVerifyingCode(true)
    setVerificationError(null)
    try {
      const result = await verifyEmailVerificationCode(email, verificationCode)
      if (!result.verified) throw new Error('信箱尚未完成驗證')
      setVerifiedEmail(normalizedEmail)
    } catch (error) {
      setVerificationError(errorMessage(error, '驗證碼驗證失敗'))
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (verifiedEmail !== normalizeEmail(values.email)) {
      setVerificationError('請先完成 Email 驗證')
      return
    }
    try {
      setServerError(null)
      await doRegister(values)
      nav(next, { replace: true })
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : '註冊失敗，請稍後再試')
    }
  })

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">建立會員</h1>
      <p className="mt-2 text-sm text-ink-2">
        已有帳號？<Link to={`/login?next=${encodeURIComponent(next)}`} className="text-accent-subtle-ink hover:text-ink underline underline-offset-4">登入</Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="姓名" htmlFor="displayName" error={errors.displayName?.message} required>
          <Input id="displayName" autoComplete="name" invalid={!!errors.displayName} {...register('displayName')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={isSendingCode || isEmailVerified || resendCountdown > 0}
              onClick={sendVerificationCode}
            >
              {isSendingCode
                ? '寄送中…'
                : isEmailVerified
                  ? '已驗證'
                  : resendCountdown > 0
                    ? `${resendCountdown} 秒後重寄`
                    : codeSentTo === normalizedEmail
                      ? '重新寄送'
                      : '寄送驗證碼'}
            </Button>
          </div>
        </Field>
        {codeSentTo === normalizedEmail && !isEmailVerified && (
          <Field
            label="Email 驗證碼"
            htmlFor="emailVerificationCode"
            hint="請輸入信件中的六位數驗證碼，10 分鐘內有效。"
            required
          >
            <div className="flex gap-2">
              <Input
                id="emailVerificationCode"
                value={verificationCode}
                onChange={(event) => {
                  setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  setVerificationError(null)
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                className="tracking-[0.25em]"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                disabled={isVerifyingCode || verificationCode.length !== 6}
                onClick={verifyCode}
              >
                {isVerifyingCode ? '驗證中…' : '驗證'}
              </Button>
            </div>
          </Field>
        )}
        {isEmailVerified && (
          <p className="rounded-md bg-success-subtle px-3 py-2 text-sm text-success-subtle-ink">
            Email 已驗證，可以繼續完成註冊。
          </p>
        )}
        {verificationError && (
          <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">
            {verificationError}
          </p>
        )}
        <Field label="手機" htmlFor="phone" error={errors.phone?.message} required>
          <Input id="phone" type="tel" autoComplete="tel" invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label="密碼" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" {...register('marketingOptIn')} className="accent-[color:var(--accent-subtle-ink)]" />
          願意收到河日的活動與新場地訊息
        </label>
        {serverError && (
          <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">{serverError}</p>
        )}
        <Button
          type="submit"
          className="w-full bg-ink text-ink-on hover:bg-accent-subtle-ink active:bg-ink"
          disabled={isSubmitting || !isEmailVerified}
        >
          {isSubmitting ? '註冊中…' : '註冊'}
        </Button>
      </form>
    </div>
  )
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase()
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
