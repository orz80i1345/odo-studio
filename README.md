# 攝影棚預約系統（Studio Booking System）

React monorepo 骨架：前台預約網站 + 後台管理網站 + 共用套件。
本階段僅建立**可擴充的架構**，頁面皆為 placeholder；`schema.sql` 與完整 UI 於後續迭代實作。

## 技術棧

React 18 · TypeScript · Vite 6 · React Router 7 · Tailwind CSS 4（CSS-first + OKLCH 色票）
TanStack Query 5 · React Hook Form + Zod · date-fns · clsx · lucide-react

## 專案結構

```
studio-booking-system/
├── package.json              # npm workspaces 根設定
├── tsconfig.base.json        # 共用 TS 設定（strict, bundler resolution）
├── .env.example
├── apps/
│   ├── booking-web/          # 前台預約網站（port 5173，主色 brand 琥珀）
│   │   └── src/
│   │       ├── main.tsx      # QueryClientProvider + RouterProvider
│   │       ├── lib.ts        # api client / query client 單例
│   │       ├── routes/router.tsx
│   │       ├── layouts/RootLayout.tsx
│   │       └── pages/        # 首頁 / 列表 / 詳情 / 預約 / 成功 / 我的預約 / 404
│   └── admin-web/            # 後台管理網站（port 5174，主色 admin 藍）
│       └── src/
│           ├── main.tsx
│           ├── lib.ts        # 帶 getToken 的 api client
│           ├── routes/router.tsx
│           ├── layouts/AdminLayout.tsx   # 側欄外框
│           └── pages/        # 登入 / 儀表板 / 預約 / 檔期 / 攝影棚 / 顧客 / 設定 / 404
└── packages/
    └── shared/               # @studio/shared
        └── src/
            ├── api/          # createApiClient、queryKeys、endpoints/（studios/bookings/auth）
            ├── types/        # Studio / Booking / AdminUser / 分頁等
            ├── utils/        # cn、date（date-fns）、format（金額）
            └── ui/           # theme.css（Tailwind v4 @theme, OKLCH）、Button、Spinner
```

## Tailwind 設定

Tailwind v4 採 CSS-first，**沒有 tailwind.config.js**；主題定義在
`packages/shared/src/ui/theme.css` 的 `@theme` 區塊，兩個 app 的 `index.css` 皆：

```css
@import 'tailwindcss';
@import '@studio/shared/theme.css';
```

色票全數使用 OKLCH（恆定色相、感知均勻）：
- `brand-*`（H=70，琥珀）→ 前台主色
- `admin-*`（H=259.8，藍）→ 後台主色
- `neutral-*` / `success` / `warning` / `danger` → 共用

## 啟動方式

```bash
# 1. 安裝（根目錄執行一次，workspaces 會一併安裝）
npm install

# 2. 設定環境變數
cp apps/booking-web/.env.example apps/booking-web/.env
cp apps/admin-web/.env.example   apps/admin-web/.env

# 3. 開發（二選一）
npm run dev            # 同時啟動前後台（concurrently）
npm run dev:booking    # 只跑前台 → http://localhost:5173
npm run dev:admin      # 只跑後台 → http://localhost:5174

# 其他
npm run typecheck      # 全部 workspace 型別檢查
npm run build          # 全部 workspace 建置
```

## 下一步（尚未實作）

1. `schema.sql` 資料庫結構
2. 各頁面 UI 與資料串接（useQuery/useMutation + queryKeys）
3. 後台登入流程與 route guard
4. 預約表單（RHF + zodResolver）與時段選擇器
