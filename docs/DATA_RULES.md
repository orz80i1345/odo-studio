# 資料規則

最後更新：2026-08-10

## 預約可用性

真正決定前台能不能預約的是：

```text
time_slots.status
```

前台可預約：

```text
available
```

前台不可預約：

```text
held
booked
blocked
maintenance
holiday
```

## Special Dates

`special_dates` 是營業例外設定，不是唯一的預約狀態來源。

阻擋型：

- `closed`：公休
- `maintenance`：維護
- `private_event`：包場

建立阻擋型特殊日期時，後台會同步封鎖該日期重疊的 `available` time_slots：

- `closed` -> `time_slots.status = blocked`
- `private_event` -> `time_slots.status = blocked`
- `maintenance` -> `time_slots.status = maintenance`

不會自動覆蓋：

- `booked`
- `held`

原因：既有預約與待付款需要人工處理，不能被公休設定靜默覆蓋。

非阻擋型：

- `special_hours`
- `holiday`
- `peak`

這些目前主要做標記或定價語意，不自動封鎖時段。

## Time Slots

`time_slots` 是時段級 source of truth。

後台產生時段時：

- 使用 `/public/time_slots/batch`
- 產生前會查既有時段避免重複
- 遇到阻擋型特殊日期會略過
- 成功後會同步更新 `studio_daily_availability`

重設時段時：

- 刪除目前選取日期的 slots
- 成功後同步更新 `studio_daily_availability`

## Studio Daily Availability

`studio_daily_availability` 是 summary cache，用於加速前台月曆。

它不是 source of truth。

資料來源：

```text
time_slots
```

更新時機：

- 後台產生 time_slots 後
- 後台設定公休/維護/包場並封鎖 slots 後
- 後台重設時段後
- 前台建立預約並更新 slots 後
- 前台取消預約並恢復 slots 後

前台月曆：

- 優先讀 `studio_daily_availability`
- 若 summary table 尚無資料，fallback 讀整月 `time_slots` 後前端計算

## Booking Flow

建立預約時：

1. 前台檢查所選區間 slots 都是 `available`
2. 建立 `bookings`
3. 將重疊 time_slots 改成 `booked`
4. 寫入 `booking_id`
5. 嘗試同步 `studio_daily_availability`

取消預約時：

1. 將 booking 狀態改成 `cancelled`
2. 將該 booking 對應 slots 改回 `available`
3. 清掉 `booking_id`
4. 嘗試同步 `studio_daily_availability`

## Payment Pending

待付款預約也應讓時段不可預約。

目前建立預約後會直接把對應 slots 設為 `booked`，所以前台不可再選。

若未付款後台或排程把 booking 改成 `cancelled`，才會把 slots 恢復為 `available`。

## Images

攝影棚與佈景圖片透過 URL 管理。

- `studio_images.url`
- `scene_images.url`

前台列表：

- 攝影棚卡片顯示封面圖
- 佈景卡片最多顯示 3 張
- 佈景圖片排序使用 `display_order`
- 封面優先使用 `is_cover = true`

`scene_images` 可以同一個 `scene_id` 多張圖片。不要用 `UNIQUE(scene_id)` 限制圖片數。

## Discount Codes

折扣碼使用：

```text
discount_codes
```

預約可記錄：

- `discount_code`
- `discount_amount`

折扣金額可以每個 code 不同，由 `discount_amount` 決定。

