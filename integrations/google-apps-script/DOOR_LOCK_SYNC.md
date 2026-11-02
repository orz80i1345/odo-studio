# 隔日預約門鎖同步

`door-lock-sync.gs` 每天讀取台北時間隔日的預約，只有以下兩個條件都成立才會建立門鎖密碼：

- `status = confirmed`
- `payment_status = paid`

門鎖 API 的 `remark` 使用 `bookings.customer_name`，`begin`、`end` 由預約的
`start_at`、`end_at` 轉成台北時間 `yyyy-MM-dd-HH`。

## 防止重複建立

每次建立前會先用 `begin + end` 查詢門鎖 API，再比對 `remark + device_id`。
相同資料已存在時會計入 `existing`，不會再次 POST。程式也使用 Apps Script
LockService，避免同一個專案的兩次執行互相重疊。

## 安裝

1. 在現有 Apps Script 專案新增檔案 `DoorLockSync`。
2. 將 `door-lock-sync.gs` 的完整內容貼入。
3. 開啟「專案設定 → 指令碼屬性」，新增：
   - 屬性：`ODO_DOOR_LOCK_API_KEY`
   - 值：門鎖 API 的實際 API Key
4. 確認 Apps Script 專案時區為 `Asia/Taipei`。
5. 先手動執行 `testDoorLockSync` 測試，並授權外部網路請求。
6. 檢查執行記錄，成功結果會包含 `created`、`existing`、`skipped`、`failed` 數量；程式不會把密碼輸出至執行記錄。
7. 手動執行一次 `installDoorLockDailyTrigger`，建立每日觸發器。

預設每天台北時間 20 時至 21 時之間執行。Apps Script 的時間觸發器不保證在
20:00 整準時觸發。若要修改時段，調整 `DAILY_TRIGGER_HOUR` 後重新執行
`installDoorLockDailyTrigger`。

## 指定門鎖裝置

預設 `device_id = 0`。若不同攝影棚對應不同裝置，在設定中加入對照：

```javascript
DEVICE_ID_BY_STUDIO: {
  '1': 0,
  '2': 1
}
```

沒有出現在對照表的攝影棚會使用 `DEFAULT_DEVICE_ID`。

## 密碼保存位置

建立或找到既有門鎖密碼後，程式會以
`ode_door_lock_booking_{booking_id}` 為鍵保存到 Apps Script 的 Script Properties，
供後續 LINE／Email 通知流程讀取。Script Properties 僅應開放給可信任的專案編輯者。

目前門鎖 API 沒有提供更新或撤銷 API。若已建立密碼後預約時間異動或取消，舊密碼
無法由此指令碼自動撤銷；要完整處理這種情況，門鎖 API 需要再提供更新／刪除端點。

