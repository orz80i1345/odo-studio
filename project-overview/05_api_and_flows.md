# API Resource 與核心流程

## 前台 API

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /me
PATCH  /me

GET    /studios
GET    /studios/:id
GET    /studios/:id/images

GET    /scenes
GET    /scenes/:id

GET    /pricing-plans

GET    /calendar/availability?year=2026&month=07
GET    /calendar/availability/:date

POST   /bookings
GET    /bookings/me
GET    /bookings/:id
POST   /bookings/:id/cancel

GET    /bank-accounts/default
```

## 後台 API

```text
POST   /admin/auth/login
POST   /admin/auth/logout
GET    /admin/me

GET    /admin/dashboard

GET    /admin/bookings
GET    /admin/bookings/:id
POST   /admin/bookings
PATCH  /admin/bookings/:id
POST   /admin/bookings/:id/confirm-payment
POST   /admin/bookings/:id/cancel
POST   /admin/bookings/:id/complete
POST   /admin/bookings/:id/no-show

GET    /admin/payments
GET    /admin/payments/:id
PATCH  /admin/payments/:id

GET    /admin/studios
POST   /admin/studios
GET    /admin/studios/:id
PATCH  /admin/studios/:id

GET    /admin/studio-images
POST   /admin/studio-images
PATCH  /admin/studio-images/:id
DELETE /admin/studio-images/:id

GET    /admin/scenes
POST   /admin/scenes
GET    /admin/scenes/:id
PATCH  /admin/scenes/:id
DELETE /admin/scenes/:id

GET    /admin/scene-images
POST   /admin/scene-images
PATCH  /admin/scene-images/:id
DELETE /admin/scene-images/:id

GET    /admin/pricing-plans
POST   /admin/pricing-plans
PATCH  /admin/pricing-plans/:id
DELETE /admin/pricing-plans/:id

GET    /admin/business-hours
POST   /admin/business-hours
PATCH  /admin/business-hours/:id
DELETE /admin/business-hours/:id

GET    /admin/time-slots
POST   /admin/time-slots
PATCH  /admin/time-slots/:id
DELETE /admin/time-slots/:id

GET    /admin/special-dates
POST   /admin/special-dates
PATCH  /admin/special-dates/:id
DELETE /admin/special-dates/:id

GET    /admin/door-lock-codes
POST   /admin/bookings/:id/door-lock-code
PATCH  /admin/door-lock-codes/:id
POST   /admin/bookings/:id/send-door-lock-code
POST   /admin/bookings/:id/resend-door-lock-code

GET    /admin/email-logs

GET    /admin/bank-accounts
POST   /admin/bank-accounts
PATCH  /admin/bank-accounts/:id
DELETE /admin/bank-accounts/:id

GET    /admin/system-settings
PATCH  /admin/system-settings/:id

GET    /admin/admin-accounts
POST   /admin/admin-accounts
PATCH  /admin/admin-accounts/:id

GET    /admin/activity-logs
```

## 月曆 Availability 邏輯

需要考慮：

- `business_hours`
- `time_slots`
- `special_dates`
- `bookings`
- booking status
- payment status

規則：

- 已取消的預約不佔用時段
- `confirmed` 一定佔用時段
- `paid` 一定佔用時段
- `pending_payment` 建議暫時佔用時段，但需要過期機制
- 公休、維護、包場不可預約
- 特殊價格覆蓋原價格

## Pending Payment 建議

建議：

- pending_payment 保留 30 分鐘到 2 小時
- 若未付款或未確認，系統可標記為 `expired`
- 逾期後釋放時段

## 防止同時搶同一時段

建立 booking 時需要：

1. 後端再次檢查該日期與時段是否可預約
2. 忽略 `cancelled` / `expired`
3. 會佔用的狀態包含：
   - `pending_payment`
   - `paid`
   - `confirmed`
4. 建議在資料庫層或後端 service 層加交易鎖或唯一檢查

## Email 通知流程

需要以下 Email：

1. 預約建立確認信
2. 付款確認信
3. 電子鎖密碼信
4. 取消預約信
5. 重新寄送電子鎖密碼信

每封信要記錄：

- email_type
- recipient_email
- subject
- status
- provider
- provider_message_id
- error_message
- sent_at

## 電子鎖流程

目前：

- 原本電子鎖 App 每天會更換一組密碼
- 前期可由後台手動輸入或產生密碼
- 密碼只在預約日前一天寄送
- 後台可查看、填入、更新、重新寄送

資料：

- booking_id
- lock_code
- valid_from
- valid_until
- send_status
- sent_at
- last_sent_at
- created_by_admin_id

## 綠界金流未來擴充

目前先使用匯款。

未來流程：

1. 使用者選擇日期與時段
2. 建立 booking
3. 建立 payment
4. 導向綠界付款
5. 綠界 callback
6. 更新 payment_status
7. 更新 booking status
8. 寄送付款確認信

預留欄位：

- payment_method
- payment_provider
- provider_trade_no
- merchant_trade_no
- provider_response
- paid_at
- expired_at

資料一致性注意：

- callback 要可重複處理，避免重複付款更新
- merchant_trade_no 要唯一
- provider_response 建議存 JSONB
- payment status 與 booking status 要有明確轉換規則
