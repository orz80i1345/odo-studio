# API 契約

最後更新：2026-10-09

## Base

```text
https://cv3op1ht.cgapps.dev/api
```

開發環境 Vite 會透過 `/api` proxy 到 `VITE_API_BASE_URL` 的 origin。

## Auth Headers

所有 scaffold CRUD API 都要帶：

```http
X-API-KEY: <VITE_API_KEY>
```

需要登入時另外帶：

```http
Authorization: Bearer <access_token>
```

## Query Filter

CRUD filter 使用 `filter`，不是 `filters`。

範例：

```http
GET /public/customer_accounts?filter=email,eq,user@example.com
```

多條件：

```http
GET /public/time_slots?filter=studio_id,eq,1&filter=slot_date,gte,2026-09-01T00:00:00Z&filter=slot_date,lt,2026-10-01T00:00:00Z
```

## Pagination

目前 API 實際 pageSize 上限約為 100。需要完整月份資料時必須分頁抓取。

前台月曆已改成優先查 `studio_daily_availability`，降低大量分頁需求。

## Date Format

雖然 DB 欄位可能是 `DATE`，但 CRUD API 寫入與查詢日期時建議使用 ISO datetime：

```text
2026-09-01T00:00:00Z
```

前端顯示與邏輯比對再轉回：

```text
2026-09-01
```

## JSONB Format

多數 JSONB 欄位透過 scaffold API 寫入時建議送字串 JSON：

```json
"{}"
```

或：

```json
"[]"
```

不要直接送 object，部分 endpoint 會出現：

```text
unsupported type map[string]interface {}
```

## Frontend Customer Auth

### Register

```http
POST /auth/register
```

Request：

```json
{
  "account": "user@example.com",
  "password": "password123"
}
```

註冊成功後前台會登入，再同步 `customer_accounts`。

### Login

```http
POST /auth/login
```

Request：

```json
{
  "account": "user@example.com",
  "password": "password123"
}
```

Response：

```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

登入後前台會使用登入 email 查：

```http
GET /public/customer_accounts?filter=email,eq,user@example.com
```

避免 `/users/me` 與 profile 不一致造成顯示錯誤。

## Bank Transfer Reconciliation

每張 booking 建立時，同步建立一筆 `payments` 待付款紀錄。資料庫欄位使用
`payer_last4`；目前部署 API 的 `doc.json` 暫時將它暴露為 `payer_las4`（少一個
`t`）。前端與 Apps Script 寫入／查詢部署 API 時使用 `payer_las4`，讀取時同時
相容兩種拼字。

前台回報匯款時，將資料寫入：

- `payments.payer_last4`
- `payments.transferred_at`
- `payments.payer_name`

自動對帳以 `payer_last4 + amount + transferred_at` 查詢，時間預設允許銀行通知時間前後 30 分鐘。若三個條件符合 0 筆或超過 1 筆，必須停止自動更新並交由人工確認。
目前 scaffold 對未知 filter 欄位可能回傳 200 並忽略該條件，因此呼叫端必須再次檢查每筆回傳資料的末四碼與金額，不能只信任 query filter。範例 Apps Script 已包含這層驗證。

查詢付款紀錄：

```http
GET /public/payments?filter=payer_las4,eq,1234&filter=amount,eq,1500&filter=transferred_at,gte,2026-10-07T03:30:00.000Z&filter=transferred_at,lte,2026-10-07T04:30:00.000Z&pageSize=100
Authorization: Bearer <admin_access_token>
```

唯一命中且目前為 `pending` 或 `failed` 後，先更新 payment：

```http
PATCH /payments/88
```

```json
{
  "status": "paid",
  "verified_at": "2026-10-07T04:00:00.000Z"
}
```

再依 `payment.booking_id` 與 `payment.payment_type` 更新 booking：

```http
PATCH /bookings/42
Authorization: Bearer <admin_access_token>
X-API-KEY: <api-key>
Content-Type: application/json
```

```json
{
  "status": "confirmed",
  "payment_status": "deposit_paid",
  "confirmed_at": "2026-10-07T04:00:00.000Z"
}
```

`payment_type=deposit` 時 booking 使用 `deposit_paid`；`full` 或 `balance` 時使用 `paid`。Apps Script 的重試流程具冪等性：payment 已是 `paid` 時仍會再次同步 booking，修復前一次只完成一半的狀況。

Google Apps Script 整合範例位於：

```text
integrations/google-apps-script/payment-reconciliation.gs
```

時間容許範圍可由 Apps Script 指令碼屬性 `ODO_PAYMENT_TIME_TOLERANCE_MINUTES` 調整，預設為 30 分鐘。複合索引建立在 `payments (payer_last4, amount, transferred_at, status)`。

部署前需先套用：

```text
db/migrations/20261009_move_reconciliation_to_payments.sql
```

## Customer Accounts

### Create

```http
POST /public/customer_accounts
```

Request：

```json
{
  "email": "user@example.com",
  "phone": "0912345678",
  "display_name": "王小明",
  "marketing_opt_in": false,
  "locale": "zh-TW",
  "is_active": true
}
```

不需要回傳或儲存明文 password。

## Time Slots

### List Day Slots

```http
GET /public/time_slots?filter=studio_id,eq,1&filter=slot_date,eq,2026-09-03T00:00:00Z&sort=start_minute
```

### Batch Create

```http
POST /public/time_slots/batch
```

Request：

```json
[
  {
    "studio_id": 1,
    "slot_date": "2026-09-03T00:00:00Z",
    "start_minute": 0,
    "end_minute": 60,
    "status": "available",
    "hourly_price": 1500,
    "metadata": "{}"
  }
]
```

## Studio Daily Availability

月曆摘要 table：

```text
studio_daily_availability
```

### List Monthly Summary

```http
GET /public/studio_daily_availability?filter=studio_id,eq,1&filter=availability_date,gte,2026-09-01T00:00:00Z&filter=availability_date,lt,2026-10-01T00:00:00Z&sort=availability_date
```

Response 每天約一筆：

```json
{
  "studio_id": 1,
  "availability_date": "2026-09-03T00:00:00Z",
  "total_count": 24,
  "available_count": 20,
  "held_count": 0,
  "booked_count": 2,
  "blocked_count": 2,
  "maintenance_count": 0,
  "holiday_count": 0,
  "is_closed": false,
  "open_start_minute": 0,
  "open_end_minute": 1440,
  "min_hourly_price": "1500",
  "max_hourly_price": "1500",
  "metadata": "{}"
}
```

## Special Dates

### Create

```http
POST /public/special_dates
```

Request：

```json
{
  "studio_id": 1,
  "special_date": "2026-09-03T00:00:00Z",
  "date_type": "closed",
  "name": "公休",
  "start_minute": 0,
  "end_minute": 1440,
  "price_multiplier": 1,
  "is_recurring": false,
  "metadata": "{}"
}
```

阻擋型特殊日期：

- `closed`
- `maintenance`
- `private_event`

建立後台會同步封鎖同日重疊的 `available` time_slots。
