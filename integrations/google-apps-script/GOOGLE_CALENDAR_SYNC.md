# Google Calendar 預約同步

`google-calendar-sync.gs` 會每 5 分鐘讀取 API 中尚未結束的預約：

- `status = confirmed` 且 `payment_status = paid`：建立或更新日曆事件。
- 不再符合條件：若先前曾同步，刪除對應事件。
- 同一筆訂單重複執行只會更新，不會重複建立。

## 安裝

1. 開啟目前處理銀行信件的 Google Apps Script 專案。
2. 新增指令碼檔案 `GoogleCalendarSync`。
3. 將 `google-calendar-sync.gs` 的完整內容貼入。
4. 若使用執行帳號的預設日曆，維持 `CALENDAR_ID: ''`；若使用共用日曆，填入該日曆的 Calendar ID。
5. 在 Apps Script 專案設定將時區設為 `Asia/Taipei`。
6. 從編輯器手動執行一次 `syncConfirmedBookingsToCalendar`，並完成 Google Calendar 權限授權。
7. 手動執行一次 `installCalendarSyncTrigger`，建立每 5 分鐘觸發器。若先前已安裝每分鐘觸發器，這個函式會先刪除舊觸發器再重建。

這個版本由 Apps Script 主動呼叫預約 API，不需要部署成 Web App，也不需要 webhook secret。

## 日曆內容

事件標題包含客戶名稱與訂單編號；說明包含電話、Email、用途、金額、付款狀態及客戶備註。預設在預約前 60 分鐘顯示通知，可由 `POPUP_REMINDER_MINUTES` 修改。
