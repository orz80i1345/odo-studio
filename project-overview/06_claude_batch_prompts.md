# Claude 分批執行 Prompt

## 使用方式

不要一次叫 Claude 完整輸出全部系統，會消耗太多 usage。請分批執行。

建議順序：

1. 建立 React monorepo 架構
2. 建立 OKLCH theme
3. 建立 schema.sql
4. 實作前台 booking-web
5. 實作後台 admin-web
6. 最後做一致性 review

---

## 第 1 批：React Monorepo 架構

```text
請根據 Project 內的文件，先只建立 React monorepo 架構。

這一輪只輸出：

1. 完整目錄結構
2. package.json workspace 設定
3. booking-web 基本 routes
4. admin-web 基本 routes
5. shared package 的 types / api / utils / ui 架構
6. Tailwind 設定檔
7. .env.example
8. 啟動方式

不要寫完整頁面。
不要寫 schema.sql。
不要寫大量 UI。
```

---

## 第 2 批：OKLCH Theme

```text
請根據 Project 內的 `04_theme_oklch.md`，只處理 UI theme 與 OKLCH 色彩系統。

這一輪只輸出：

1. src/styles/theme.css
2. Tailwind v4 @theme tokens
3. light mode tokens
4. dark mode tokens
5. button / input / card / badge / calendar / table 色彩規範
6. 預約狀態色
7. 付款狀態色
8. 電子鎖 / email 狀態色
9. 對比檢查說明

不要實作頁面。
```

---

## 第 3 批：schema.sql

```text
請根據 Project 內的 `03_schema_requirements.md`，只輸出完整 schema.sql。

注意：

- 不使用 BIGINT
- 不使用 BIGSERIAL
- 不使用 SMALLINT
- 不使用 UUID
- 不使用 VECTOR
- 不使用 TIME
- 不使用 users table name
- 前台會員 table 使用 customer_accounts
- 後台管理者 table 使用 studio_admin_accounts
- id 使用 INTEGER PRIMARY KEY
- 狀態欄位使用 VARCHAR

請最後補充 table 關聯說明與狀態值定義。
不要寫 React 頁面。
```

---

## 第 4 批：booking-web 前台

```text
請根據 Project 內的文件，這一輪只實作 booking-web 前台預約網站。

請輸出：

1. booking-web 目錄結構
2. routes 設計
3. pages code
4. components code
5. hooks code
6. api client code
7. auth guard code
8. calendar availability UI
9. booking flow code
10. shared types 使用方式

必須支援：

- 未登入不能進入預約頁
- 登入後導回預約頁
- 預約表單自動帶入 name / email / phone
- 月曆預約
- 選擇日期與時段
- 確認預約
- 完成後顯示匯款資訊

不要實作後台。
```

---

## 第 5 批：admin-web 後台

```text
請根據 Project 內的文件，這一輪只實作 admin-web 後台管理網站。

請輸出：

1. admin-web 目錄結構
2. routes 設計
3. AdminLayout
4. Sidebar
5. Dashboard page
6. Bookings table
7. Booking detail page
8. CRUD form components
9. Payments page
10. Door lock page
11. Email logs page
12. API client code
13. 權限與登入流程

必須支援：

- 管理員登入
- Dashboard
- 預約管理
- 付款確認
- 電子鎖密碼管理
- Email logs
- 營業時間與時段管理
- 特殊日期管理
- 佈景與圖片管理
- 價格方案管理
- 匯款帳號管理
```

---

## 第 6 批：一致性 Review

```text
請根據目前已建立的 booking-web、admin-web、shared package、schema.sql 做一致性檢查。

請檢查：

1. 前台 API 是否對應 schema
2. 後台 API 是否對應 schema
3. shared types 是否與 schema 欄位一致
4. booking status 是否一致
5. payment status 是否一致
6. door lock status 是否一致
7. email status 是否一致
8. routes 是否完整
9. 是否有使用到資料庫不支援的 type
10. 是否有誤用 users table name
11. 是否有使用 BIGINT / UUID / TIME / VECTOR
12. OKLCH theme 是否有被前台與後台使用

請只輸出需要修正的地方與修正 code。
```
