const CODE_TTL_SECONDS = 10 * 60
const RESEND_COOLDOWN_SECONDS = 60
const MAX_ATTEMPTS = 5

export async function onRequestPost(context) {
  const { request, env, params } = context

  if (!env.EMAIL_VERIFICATION_DB || !env.EMAIL_OTP_SECRET || !env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return json({ message: '信箱驗證服務尚未完成設定' }, 503)
  }

  const action = String(params.action || '')
  if (action !== 'request' && action !== 'verify') {
    return json({ message: '不支援的信箱驗證操作' }, 404)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return json({ message: '請送出正確的 JSON 資料' }, 400)
  }

  const email = normalizeEmail(body.email)
  if (!isValidEmail(email)) {
    return json({ message: '請輸入正確的 Email' }, 400)
  }

  try {
    return action === 'request'
      ? await requestCode(env, email)
      : await verifyCode(env, email, body.code)
  } catch (error) {
    console.error('Email verification failed', error)
    return json({ message: '信箱驗證服務暫時無法使用，請稍後再試' }, 500)
  }
}

async function requestCode(env, email) {
  const now = Math.floor(Date.now() / 1000)
  const emailKey = await sha256(email)
  const existing = await env.EMAIL_VERIFICATION_DB
    .prepare('SELECT sent_at FROM email_verification_codes WHERE email_key = ?1')
    .bind(emailKey)
    .first()

  if (existing && now - Number(existing.sent_at) < RESEND_COOLDOWN_SECONDS) {
    return json({
      message: '請稍後再重新寄送驗證碼',
      retryAfter: RESEND_COOLDOWN_SECONDS - (now - Number(existing.sent_at)),
    }, 429)
  }

  const code = createSixDigitCode()
  const codeHash = await hmacSha256(env.EMAIL_OTP_SECRET, `${email}:${code}`)
  const expiresAt = now + CODE_TTL_SECONDS

  await env.EMAIL_VERIFICATION_DB.prepare(`
    INSERT INTO email_verification_codes (email_key, code_hash, attempt_count, sent_at, expires_at)
    VALUES (?1, ?2, 0, ?3, ?4)
    ON CONFLICT(email_key) DO UPDATE SET
      code_hash = excluded.code_hash,
      attempt_count = 0,
      sent_at = excluded.sent_at,
      expires_at = excluded.expires_at
  `).bind(emailKey, codeHash, now, expiresAt).run()

  const emailPayload = {
    from: env.EMAIL_FROM,
    to: [email],
    subject: '河日 Ode Studio 會員註冊驗證碼',
    text: `您的驗證碼是 ${code}。驗證碼將於 10 分鐘後失效；若不是您本人操作，請忽略此信件。`,
    html: verificationEmailHtml(code),
  }
  if (env.EMAIL_REPLY_TO) emailPayload.reply_to = env.EMAIL_REPLY_TO

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  })

  if (!emailResponse.ok) {
    const detail = await emailResponse.text()
    console.error('Resend rejected verification email', emailResponse.status, detail)
    await env.EMAIL_VERIFICATION_DB
      .prepare('DELETE FROM email_verification_codes WHERE email_key = ?1')
      .bind(emailKey)
      .run()
    return json({ message: '驗證信寄送失敗，請稍後再試' }, 502)
  }

  return json({
    success: true,
    expiresIn: CODE_TTL_SECONDS,
    resendAfter: RESEND_COOLDOWN_SECONDS,
  })
}

async function verifyCode(env, email, rawCode) {
  const code = String(rawCode || '').trim()
  if (!/^\d{6}$/.test(code)) {
    return json({ message: '請輸入六位數驗證碼' }, 400)
  }

  const now = Math.floor(Date.now() / 1000)
  const emailKey = await sha256(email)
  const entry = await env.EMAIL_VERIFICATION_DB
    .prepare(`
      SELECT code_hash, attempt_count, expires_at
      FROM email_verification_codes
      WHERE email_key = ?1
    `)
    .bind(emailKey)
    .first()

  if (!entry || Number(entry.expires_at) < now) {
    if (entry) {
      await env.EMAIL_VERIFICATION_DB
        .prepare('DELETE FROM email_verification_codes WHERE email_key = ?1')
        .bind(emailKey)
        .run()
    }
    return json({ message: '驗證碼已失效，請重新寄送' }, 400)
  }

  if (Number(entry.attempt_count) >= MAX_ATTEMPTS) {
    return json({ message: '驗證錯誤次數過多，請重新寄送驗證碼' }, 429)
  }

  const submittedHash = await hmacSha256(env.EMAIL_OTP_SECRET, `${email}:${code}`)
  if (!timingSafeEqual(String(entry.code_hash), submittedHash)) {
    const attempts = Number(entry.attempt_count) + 1
    await env.EMAIL_VERIFICATION_DB
      .prepare('UPDATE email_verification_codes SET attempt_count = ?1 WHERE email_key = ?2')
      .bind(attempts, emailKey)
      .run()
    return json({
      message: attempts >= MAX_ATTEMPTS
        ? '驗證錯誤次數過多，請重新寄送驗證碼'
        : '驗證碼錯誤',
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts),
    }, 400)
  }

  await env.EMAIL_VERIFICATION_DB
    .prepare('DELETE FROM email_verification_codes WHERE email_key = ?1')
    .bind(emailKey)
    .run()

  return json({ verified: true })
}

function createSixDigitCode() {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return String(values[0] % 1_000_000).padStart(6, '0')
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(digest)
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toHex(signature)
}

function toHex(value) {
  return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

function verificationEmailHtml(code) {
  return `
    <div style="font-family: Arial, sans-serif; color: #3e342f; line-height: 1.7; max-width: 520px; margin: 0 auto; padding: 32px;">
      <p style="letter-spacing: .18em; color: #82766e;">ODE STUDIO</p>
      <h1 style="font-size: 24px; font-weight: 500;">會員註冊驗證</h1>
      <p>請在河日 Ode Studio 的註冊頁面輸入以下六位數驗證碼：</p>
      <p style="font-size: 34px; letter-spacing: .25em; font-weight: 600; margin: 28px 0;">${code}</p>
      <p style="color: #82766e;">驗證碼將於 10 分鐘後失效。若不是您本人操作，請忽略此信件。</p>
    </div>
  `
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
