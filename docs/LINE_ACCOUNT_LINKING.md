# 網站會員綁定 LINE

## 前端設定

在 `apps/booking-web/.env` 設定：

```env
VITE_LINE_LIFF_ID=你的_LIFF_ID
VITE_LINE_LINK_ENDPOINT=/workflow/你的_workflow_id/execute
```

LIFF Endpoint URL 應設為正式網站的 `https://你的網站/line/link`。
`VITE_LINE_LIFF_ID` 是公開識別碼，可以放在前端；LINE Channel Secret 不可放在任何 `VITE_` 變數。

登入會員的預約同時為「已確認」與「已付款」後，預約詳細頁會顯示「綁定 LINE 帳號」。綁定頁會：

1. 透過 LIFF 取得 LINE access token。
2. 呼叫 `POST /line/login-profile`，由 API 驗證 token 並取得可信任的 LINE userId。
3. 呼叫 `VITE_LINE_LINK_ENDPOINT`。網站登入 token 會放在 `Authorization` header，LINE access token 則放在 body。

Workflow 收到的 body：

```json
{
  "lineAccessToken": "LINE access token",
  "bookingId": 123,
  "source": "booking_web"
}
```

## 綁定 Workflow

Workflow 必須在伺服器端依序完成：

1. 使用觸發請求的網站 `Authorization` 呼叫 `GET /users/me`，取得目前登入的網站 `user_id`。
2. 用 `user_id` 查出唯一的 `customer_accounts.id`。不可接受前端直接指定 `customer_account_id`。
3. 使用 body 的 `lineAccessToken` 呼叫 `POST /line/login-profile`，從 API 驗證結果取得 `line_user_id`。不可接受前端直接指定 `line_user_id`。
4. 以 `customer_account_id + line_channel_id` 查詢 `customer_line_accounts`：
   - 沒有資料：新增一筆。
   - 已有資料：更新 `line_user_id`、`status=active`、`notification_enabled=true`、`linked_at=現在時間`，並清空 `blocked_at`、`unlinked_at`。
5. 若該 `line_user_id + line_channel_id` 已綁定其他網站會員，停止流程並記錄衝突，不可悄悄轉移帳號。

`line_channel_id` 應由 workflow 的伺服器端設定提供，不可相信前端傳入值。LINE Login 與 Messaging API channel 必須位於同一個 Provider，兩邊取得的 LINE userId 才能一致並用於推播。

建議新增下列唯一索引，避免重複綁定：

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_line_accounts_customer_channel
ON customer_line_accounts (customer_account_id, line_channel_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_line_accounts_line_user_channel
ON customer_line_accounts (line_user_id, line_channel_id);
```

