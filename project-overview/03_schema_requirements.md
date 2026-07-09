# schema.sql 設計需求

## 重要限制

目前資料庫不支援：

- BIGINT
- BIGSERIAL
- SMALLINT
- UUID
- VECTOR
- TIME

目前可使用：

- INTEGER
- NUMERIC
- VARCHAR
- TEXT
- DATE
- TIMESTAMP
- TIMESTAMPTZ
- BOOLEAN
- JSON
- JSONB
- ENUM

## 命名限制

不可使用 `users` 作為 table name，因為系統已經有預設 users table，不能更改，也會衝突。

請使用：

- 前台會員：`customer_accounts`
- 後台管理者：`studio_admin_accounts`

## ID 規則

- 所有 primary key 使用 `INTEGER PRIMARY KEY`
- 如果需要 auto increment，使用系統支援的 INTEGER 自動遞增方式
- 不使用 UUID

## 時間與時段

不使用 `TIME` type。

時段使用分鐘數：

- `start_minute INTEGER`
- `end_minute INTEGER`

範例：

| 顯示時間 | 儲存值 |
|---|---:|
| 00:00 | 0 |
| 09:00 | 540 |
| 14:00 | 840 |
| 19:00 | 1140 |
| 24:00 | 1440 |

實際預約開始與結束時間使用：

- `booking_start_at TIMESTAMPTZ`
- `booking_end_at TIMESTAMPTZ`

## 狀態欄位

狀態欄位先使用 `VARCHAR`，不要使用 ENUM，方便後續調整。

## 必要 Tables

schema.sql 至少包含：

1. `customer_accounts`
2. `studio_admin_accounts`
3. `studios`
4. `studio_images`
5. `scenes`
6. `scene_images`
7. `pricing_plans`
8. `business_hours`
9. `time_slots`
10. `special_dates`
11. `bookings`
12. `payments`
13. `payment_logs`
14. `door_lock_codes`
15. `email_logs`
16. `email_templates`
17. `bank_accounts`
18. `system_settings`
19. `admin_activity_logs`

## 必須支援

- 前台會員
- 後台管理員
- 攝影棚資料
- 攝影棚圖片
- 佈景資料
- 佈景圖片
- 價格方案
- 營業時間
- 可預約時段
- 特殊日期、公休、維護、包場
- 預約
- 匯款付款
- 綠界金流欄位預留
- 電子鎖密碼
- Email 寄送紀錄
- Email template
- 匯款帳號
- 系統設定
- 後台操作紀錄
- 月曆 availability 查詢

## 狀態值

### Booking Status

| Value | 中文 |
|---|---|
| pending_payment | 待付款 |
| paid | 已付款 |
| confirmed | 已確認 |
| cancelled | 已取消 |
| completed | 已完成 |
| no_show | 未到場 |

### Payment Status

| Value | 中文 |
|---|---|
| unpaid | 未付款 |
| pending | 等待確認 |
| paid | 已付款 |
| failed | 付款失敗 |
| expired | 付款逾期 |
| refunded | 已退款 |

### Door Lock Code Send Status

| Value | 中文 |
|---|---|
| not_sent | 尚未寄送 |
| scheduled | 已排程 |
| sent | 已寄送 |
| failed | 寄送失敗 |
| resent | 已重新寄送 |

### Email Status

| Value | 中文 |
|---|---|
| pending | 等待寄送 |
| sent | 已寄送 |
| failed | 寄送失敗 |

### Special Date Type

| Value | 中文 |
|---|---|
| closed | 公休 |
| maintenance | 維護 |
| private_event | 包場 |
| custom_price | 特殊價格 |
| available | 特別開放 |
