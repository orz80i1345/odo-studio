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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = handleSubmit(async (values) => {
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
        已有帳號？<Link to={`/login?next=${encodeURIComponent(next)}`} className="text-brand hover:text-brand-hover underline underline-offset-4">登入</Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="姓名" htmlFor="displayName" error={errors.displayName?.message} required>
          <Input id="displayName" autoComplete="name" invalid={!!errors.displayName} {...register('displayName')} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field label="手機" htmlFor="phone" error={errors.phone?.message} required>
          <Input id="phone" type="tel" autoComplete="tel" invalid={!!errors.phone} {...register('phone')} />
        </Field>
        <Field label="密碼" htmlFor="password" error={errors.password?.message} required>
          <Input id="password" type="password" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" {...register('marketingOptIn')} className="accent-[color:var(--brand)]" />
          願意收到河日的活動與新場地訊息
        </label>
        {serverError && (
          <p className="rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">{serverError}</p>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '註冊中…' : '註冊'}
        </Button>
      </form>
    </div>
  )
}
