# 門鎖密碼 LINE／Email 通知

`door-lock-notification.gs` 每小時讀取即將開始的預約，並依預約的開始時間、結束時間、
預約人姓名與門鎖裝置查詢門鎖 API：

- 找到有效的 `customer_line_accounts`：透過 LINE Messaging API push message。
- 沒有 LINE 綁定：寄送至 `bookings.customer_email`。
- LINE API 推送失敗：自動改寄 Email。
- 同一筆 booking 發送成功後會寫入 Script Properties，避免重複通知。

只有 `status=confirmed` 且 `payment_status=paid` 的預約會被處理。

## 為什麼需要後台帳號

`customer_line_accounts.line_user_id` 是敏感識別資訊，資料表只允許 admin 讀取，不能為了
Apps Script 改成 public。指令碼會以後台帳號登入取得短效 access token，再查詢該預約會員
的有效 LINE 綁定。後台密碼與 LINE Channel Access Token 都只能放在 Script Properties。

## 指令碼屬性

在 Apps Script「專案設定 → 指令碼屬性」設定：

| 屬性 | 用途 |
| --- | --- |
| `ODO_DOOR_LOCK_API_KEY` | 查詢門鎖 API |
| `ODO_LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging API 長效 Channel Access Token |
| `ODO_API_ADMIN_ACCOUNT` | 可讀取 `customer_line_accounts` 的後台帳號 |
| `ODO_API_ADMIN_PASSWORD` | 上述後台帳號密碼 |

不要把這些值直接寫進 `.gs` 程式碼或執行記錄。

## 安裝與測試

1. 在同一個 Apps Script 專案新增 `DoorLockNotification` 檔案。
2. 貼入 `door-lock-notification.gs` 完整內容。
3. 設定上方四個 Script Properties。
4. 確認專案時區為 `Asia/Taipei`。
5. 手動執行 `testDoorLockNotification` 並完成權限授權。
6. 確認執行結果後，執行一次 `installDoorLockNotificationTrigger`。
7. 到左側「觸發條件」確認 `notifyUpcomingBookingsWithDoorCode` 為每小時執行。

執行結果只記錄 `line`、`email`、`skipped`、`failed` 數量，不會將門鎖密碼輸出到
執行記錄。

## 查詢時間範圍與重試

正常通知範圍是現在起 60 分鐘內。程式同時回查過去 60 分鐘但尚未成功通知的預約，讓
暫時性 API 或寄信錯誤可以在下一次每小時執行時補送。已成功通知的 booking 會略過，
因此不會重複發送。

## LINE 必要條件

LINE Login channel 與 Messaging API channel 必須位於同一個 LINE Provider，兩邊取得的
userId 才能互通。使用者也必須加入且未封鎖官方帳號，否則 LINE push 可能失敗；此時程式
會改寄 Email。

## 目前限制

- 門鎖 API 只有小時精度，所以預約開始與結束時間必須是整點。
- 門鎖查詢若找不到或同時找到多筆完全相符資料，程式不會猜測密碼，也不會發送通知。
- 發送紀錄目前保存在 Script Properties。若未來要由後台查詢完整通知歷史，應新增以
  `booking_id` 為主的通知紀錄表；目前的 `line_notification_logs` 綁定 `payment_id`，不適合
  直接記錄門鎖通知。

