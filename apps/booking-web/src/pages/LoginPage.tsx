/**
 * LoginPage — 登入。
 * - 表單：react-hook-form + zod
 * - 登入成功後讀 URL 的 ?next 參數回到原本頁面（滿足需求：登入成功後回到原本想去的預約頁）
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError, Button } from '@studio/shared'
import { useAuth } from '../auth/AuthContext'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email('請輸入正確 email'),
  password: z.string().min(6, '密碼至少 6 字'),
})
type Form = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/'
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'demo@ode.studio', password: 'demo1234' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null)
      await login(values)
      nav(next, { replace: true })
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : '登入失敗，請稍後再試')
    }
  })

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink">登入</h1>
      <p className="mt-2 text-sm text-ink-2">
        還沒有帳號？<Link to={`/register?next=${encodeURIComponent(next)}`} className="text-brand hover:text-brand-hover underline underline-offset-4">註冊</Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="密碼" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
        </Field>
        {serverError && (
          <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">{serverError}</p>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '登入中…' : '登入'}
        </Button>
      </form>

      <p className="mt-6 text-xs text-ink-3">
        Demo 帳號已預填。目前為 mock 模式，任何 email + 6 位以上密碼皆可登入。
      </p>
    </div>
  )
}
