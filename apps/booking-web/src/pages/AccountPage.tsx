import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError, Button } from '@studio/shared'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Field } from '../components/ui/Field'
import { Input } from '../components/ui/Input'

const schema = z.object({
  displayName: z.string().min(2, '請輸入姓名'),
  phone: z.string().min(8, '請輸入正確電話'),
  marketingOptIn: z.boolean().optional(),
})

type Form = z.infer<typeof schema>

export function AccountPage() {
  const { user, updateProfile } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? '',
      phone: user?.phone ?? '',
      marketingOptIn: user?.marketingOptIn ?? false,
    },
  })

  useEffect(() => {
    reset({
      displayName: user?.displayName ?? '',
      phone: user?.phone ?? '',
      marketingOptIn: user?.marketingOptIn ?? false,
    })
  }, [reset, user])

  const onSubmit = handleSubmit(async (values) => {
    try {
      setServerError(null)
      setSaved(false)
      await updateProfile(values)
      setSaved(true)
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : '儲存失敗，請稍後再試')
    }
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="會員資料"
        subtitle="管理預約會帶入的聯絡資料。Email 為登入帳號，暫不開放在前台修改。"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form onSubmit={onSubmit} className="rounded-xl border border-line bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="姓名" htmlFor="displayName" error={errors.displayName?.message} required>
              <Input id="displayName" autoComplete="name" invalid={!!errors.displayName} {...register('displayName')} />
            </Field>
            <Field label="手機" htmlFor="phone" error={errors.phone?.message} required>
              <Input id="phone" type="tel" autoComplete="tel" invalid={!!errors.phone} {...register('phone')} />
            </Field>
          </div>

          <Field label="Email" htmlFor="email" className="mt-4" hint="Email 是登入帳號；如需更換，請聯繫管理員。">
            <Input id="email" type="email" value={user?.email ?? ''} disabled />
          </Field>

          <label className="mt-5 flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" {...register('marketingOptIn')} className="accent-[color:var(--brand)]" />
            願意收到河日的活動與新場地訊息
          </label>

          {serverError && (
            <p className="mt-5 rounded-md bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-ink">{serverError}</p>
          )}
          {saved && (
            <p className="mt-5 rounded-md bg-success-subtle px-3 py-2 text-sm text-success-subtle-ink">會員資料已更新。</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? '儲存中…' : '儲存變更'}
            </Button>
            <Link to="/my-bookings" className="text-sm text-ink-2 underline underline-offset-4 hover:text-ink">
              查看我的預約
            </Link>
          </div>
        </form>

        <aside className="rounded-xl border border-line bg-sunken/50 p-5">
          <h2 className="font-serif text-lg text-ink">預約資料帶入</h2>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            修改後，下一次預約確認頁會自動帶入新的姓名與電話；既有訂單資料不會被回寫。
          </p>
        </aside>
      </div>
    </div>
  )
}
