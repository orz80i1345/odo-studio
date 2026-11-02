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

1. 透過 LIFF 取得 LINE Login access token。
2. 呼叫 `VITE_LINE_LINK_ENDPOINT`。網站登入 token 會放在 `Authorization` header，LINE access token 則放在 body。
3. Workflow 直接呼叫 LINE 官方 API 驗證 token 並取得可信任的 LINE userId。

Workflow 收到的 body：

```json
{
  "websiteAccessToken": "網站會員 JWT（不含 Bearer）",
  "lineUserId": "LIFF getProfile().userId，失敗時使用 ID token 的 sub",
  "lineDisplayName": "LINE 顯示名稱",
  "lineAccessToken": "LINE access token",
  "lineProfileSource": "liff_profile 或 liff_id_token",
  "lineProfileVerified": false,
  "bookingId": 123,
  "source": "booking_web"
}
```

目前過渡版本優先使用 `liff.getProfile().userId`，Profile 取用失敗時改讀 OpenID ID token 的 `sub`，並將 `lineUserId` 送入 workflow。此值來自前端，因此必須保留 `lineProfileVerified=false`；正式啟用門鎖密碼通知前，仍應改為由伺服器驗證 token 後取得 userId。

## 綁定 Workflow

Workflow 必須在伺服器端依序完成：

1. 使用觸發請求的網站 `Authorization` 呼叫 `GET /users/me`，取得目前登入的網站 `user_id`。
2. 用 `user_id` 查出唯一的 `customer_accounts.id`。不可接受前端直接指定 `customer_account_id`。
3. 呼叫 LINE 官方 `GET https://api.line.me/oauth2/v2.1/verify?access_token={lineAccessToken}`，確認 `client_id` 是此 LIFF 所屬的 LINE Login Channel ID、`scope` 包含 `profile`，且 token 未過期。
4. 呼叫 LINE 官方 `GET https://api.line.me/v2/profile`，header 使用 `Authorization: Bearer {lineAccessToken}`，從回應取得 `line_user_id`。不可接受前端直接指定 `line_user_id`。
5. 以 `customer_account_id + line_channel_id` 查詢 `customer_line_accounts`：
   - 沒有資料：新增一筆。
   - 已有資料：更新 `line_user_id`、`status=active`、`notification_enabled=true`、`linked_at=現在時間`，並清空 `blocked_at`、`unlinked_at`。
6. 若該 `line_user_id + line_channel_id` 已綁定其他網站會員，停止流程並記錄衝突，不可悄悄轉移帳號。

`line_channel_id` 應由 workflow 的伺服器端設定提供，不可相信前端傳入值。LINE Login 與 Messaging API channel 必須位於同一個 Provider，兩邊取得的 LINE userId 才能一致並用於推播。

建議新增下列唯一索引，避免重複綁定：

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_line_accounts_customer_channel
ON customer_line_accounts (customer_account_id, line_channel_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_line_accounts_line_user_channel
ON customer_line_accounts (line_user_id, line_channel_id);
```

