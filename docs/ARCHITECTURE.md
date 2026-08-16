# 河日 Ode Studio 架構說明

最後更新：2026-08-10

## Repos

本專案目前分成兩個前端 repo，兩邊都透過同一組 CRUD API 存取資料。

### 前台預約網站

路徑：

```text
/Users/tang/Downloads/odo-studio
```

主要 app：

```text
apps/booking-web
```

用途：

- 展示攝影棚、佈景、價格與 FAQ
- 會員註冊、登入、修改會員資料
- 查詢可預約日期與時段
- 建立預約、取消預約、查看我的預約
- 顯示匯款資訊與付款狀態

### 管理後台

路徑：

```text
/Users/tang/Downloads/odo-studio-backend-web
```

主要 app：

```text
apps/admin-web
```

用途：

- 管理攝影棚、佈景、圖片 URL
- 管理預約、付款、取消狀態
- 管理檔期、time_slots、special_dates
- 管理折扣碼
- 管理顧客資料
- 管理系統設定、付款與匯款資訊

## Shared Package

兩個 repo 都有自己的 `packages/shared` 或 `apps/*/src/shared`。

目前前台 Vite alias 指向：

```text
apps/booking-web/src/shared/index.ts
```

後台則使用 workspace package：

```text
packages/shared
```

重要：前台和後台 shared API 實作可能不是同一份檔案，調整 API 行為時要確認是否需要同步改兩邊。

## API

目前主要使用 scaffold CRUD API：

```text
https://cv3op1ht.cgapps.dev/api
```

前台和後台都需要帶：

```http
X-API-KEY: <VITE_API_KEY>
```

需要登入的 API 另外帶：

```http
Authorization: Bearer <access_token>
```

## Source Of Truth

可不可預約的真正來源是：

```text
time_slots.status
```

月曆快速顯示使用：

```text
studio_daily_availability
```

但 `studio_daily_availability` 只是 summary cache，不是最終資料來源。

## Key Tables

- `studios`：攝影棚資料
- `studio_images`：攝影棚圖片
- `scenes`：佈景資料
- `scene_images`：佈景圖片
- `time_slots`：實際可預約/不可預約時段
- `studio_daily_availability`：每日可用性摘要快取
- `special_dates`：公休、維護、包場、假日、尖峰等特殊日期
- `bookings`：預約單
- `customer_accounts`：前台會員 profile
- `discount_codes`：折扣碼
- `bank_accounts`：匯款帳戶
- `system_settings`：一般系統設定

## Frontend Ports

- booking-web：`5173`
- admin-web：`5174`

