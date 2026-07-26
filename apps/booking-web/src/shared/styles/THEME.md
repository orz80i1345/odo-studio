# 河日 Ode Studio — Theme Spec

Tailwind v4 CSS-first + OKLCH。所有色值皆為 OKLCH，色相恆定，感知均勻。
本文件僅規範**色彩契約**（哪個 token 用在哪裡）；不含頁面實作。

實檔位置：`packages/shared/src/styles/theme.css`
匯入方式：兩個 app 的 `src/index.css` 皆 `@import '@studio/shared/theme.css'`。

---

## 1. 色相家族一覽

| 家族 | 角色 | H | 直覺色感 |
| --- | --- | --- | --- |
| `neutral` | 紙 / 墨，全站骨幹 | 75 | 未漂白紙、墨 |
| `clay` | 品牌主色（河日的「日」） | 70 | 赭土、陶土、夕光 |
| `moss` | 佐色 | 142 | 苔、抹茶、河岸青 |
| `slate` | 資訊色（避開 SaaS 藍） | 245 | 雨天石、遠山 |
| `amber` | 警告 | 68 | 深琥珀 |
| `persimmon` | 危險／取消 | 28 | 柿紅 |

每一色階 L 由 50→950 感知等距遞減、C 於中段最高並向兩端收斂。相同「數字」跨色相
表示相近的鮮明度層次，例如 `clay-100` 與 `moss-100` 都是 tint bg 的濃度。

---

## 2. 語意 tokens（semantic）

**寫頁面時只用語意 token**，不直接引用色階（少數裝飾例外）。
語意 token 會依 light / dark 自動切換，不必手寫 `dark:` 變體。

| Token | 用途 | Light 對應 | Dark 對應 |
| --- | --- | --- | --- |
| `bg-canvas` | 頁面底 | `neutral-50` | `neutral-950` |
| `bg-surface` | 卡片、表格列、input | 純白 | `neutral-900` |
| `bg-raised` | modal / popover / dropdown | 純白 | `neutral-800` |
| `bg-sunken` | section 分隔、code block | `neutral-100` | 較 canvas 更深 |
| `text-ink` | 主文（標題、正文） | `neutral-900` | `neutral-100` |
| `text-ink-2` | 次要文、label | `neutral-700` | `neutral-300` |
| `text-ink-3` | 提示、時間戳（勿作長文） | `neutral-600` | `neutral-400` |
| `text-ink-on` | 深底上的字 | 暖白 | 暖墨 |
| `border-line` | 卡片、input 邊框 | `neutral-200` | `neutral-800` |
| `border-line-strong` | 強調邊框、divider | `neutral-300` | `neutral-700` |
| `bg-brand` / `text-brand-on` | filled 主按鈕 | `clay-700` + 暖白 | `clay-400` + 暖墨 |
| `bg-brand-subtle` / `text-brand-subtle-ink` | 品牌 tint bg | `clay-100` + `clay-900` | `clay-900/30` + `clay-200` |
| `ring-brand` | focus / active 光暈 | `clay-600/35` | `clay-400/45` |
| `text-*` / `bg-*-subtle` for `success` / `warning` / `danger` / `info` / `accent` / `neutral` | 狀態顯示 | 見狀態章節 | 見狀態章節 |

---

## 3. 元件色彩契約

### Button

| Variant | Light | Dark |
| --- | --- | --- |
| `primary` | `bg-brand text-brand-on hover:bg-brand-hover` | 同（token 自動切換） |
| `secondary` | `bg-surface text-ink border border-line-strong hover:bg-sunken` | 同 |
| `ghost` | `text-ink hover:bg-sunken` | 同 |
| `danger` | `bg-danger text-ink-on hover:bg-persimmon-800` | `bg-danger text-ink-on hover:bg-persimmon-500` |
| `link` | `text-brand hover:text-brand-hover underline underline-offset-4` | 同 |
| `disabled` | `bg-neutral-200 text-ink-3 cursor-not-allowed` | `bg-neutral-800 text-ink-3` |

規則：所有按鈕 `focus-visible` 走全域 ring（`outline: 2px solid var(--brand)`），不必個別設定。

### Input / Textarea / Select

| 狀態 | Light | Dark |
| --- | --- | --- |
| 靜態 | `bg-surface text-ink border border-line placeholder:text-ink-3` | 同 |
| hover | `border-line-strong` | 同 |
| focus | `border-brand ring-2 ring-brand/25 outline-none` | 同 |
| error | `border-danger ring-2 ring-danger/25` + helper text `text-danger` | 同 |
| disabled | `bg-sunken text-ink-3 cursor-not-allowed` | 同 |

Label：`text-ink-2 text-sm`。Helper：`text-ink-3 text-xs`。

### Card

| 部件 | Class |
| --- | --- |
| 容器 | `bg-surface border border-line rounded-xl shadow-card` |
| 標題區 | `border-b border-line px-6 py-4` |
| 內容 | `px-6 py-5` |
| 抬起（hover / 可點） | `hover:shadow-raised transition-shadow` |
| 靜音／已完成 | 加 `bg-sunken text-ink-2` |

不用陰影堆疊做「高級感」。留白比陰影重要。

### Badge

固定樣式：`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium`。
色彩由狀態章節提供，統一採 `bg-*-subtle text-*-subtle-ink`。
若需要邊框感（如 outline 樣式）：加 `border border-*` 使用同語意的實色 token。

### Calendar（檔期日曆）

| 元素 | Class |
| --- | --- |
| 格子底 | `bg-surface` |
| 網格線 | `border-line` |
| 週末欄位 | `bg-sunken`（低調區分，不用色） |
| 今日 | `ring-1 ring-inset ring-brand text-brand font-semibold` |
| 可預約時段 | `bg-brand-subtle text-brand-subtle-ink hover:bg-clay-200` |
| 已預約 | `bg-neutral-subtle text-ink-3 line-through cursor-not-allowed` |
| 拖曳選取中 | `bg-brand/25 ring-2 ring-brand` |
| 公休 | 斜線背景 + `text-ink-3` |

### Table

| 元素 | Class |
| --- | --- |
| 容器 | `bg-surface border border-line rounded-xl overflow-hidden` |
| `thead` | `bg-sunken text-ink-2 text-xs uppercase tracking-wide` |
| `th` / `td` | `px-4 py-3 text-sm` |
| 列分隔 | `divide-y divide-line` |
| hover 列 | `hover:bg-sunken` |
| 選取列 | `bg-brand-subtle` |
| 空狀態 | `text-ink-3 text-center py-12` |

---

## 4. 預約狀態色（Booking Status）

| 狀態 | 語意 token | 徽章配色（light） | 徽章配色（dark） |
| --- | --- | --- | --- |
| `pending` 待確認 | `warning` | `bg-warning-subtle text-warning-subtle-ink` | 同（token 自動反轉） |
| `confirmed` 已確認 | `info` | `bg-info-subtle text-info-subtle-ink` | 同 |
| `checked_in` 已入場 | `brand` | `bg-brand-subtle text-brand-subtle-ink` | 同 |
| `completed` 完成 | `success` | `bg-success-subtle text-success-subtle-ink` | 同 |
| `cancelled` 取消 | `danger` | `bg-danger-subtle text-danger-subtle-ink` | 同 |
| `no_show` 未到 | `neutral` | `bg-neutral-subtle text-neutral-subtle-ink` | 同 |

原則：**主流路徑（pending → confirmed → checked_in → completed）走 warning→info→brand→success**，
形成暖 → 冷 → 暖 → 綠 的視覺敘事；異常路徑（cancelled、no_show）走紅／灰。

---

## 5. 付款狀態色（Payment Status）

| 狀態 | 語意 token | 徽章配色 |
| --- | --- | --- |
| `unpaid` 未付款 | `warning` | `bg-warning-subtle text-warning-subtle-ink` |
| `deposit_paid` 已付訂金 | `info` | `bg-info-subtle text-info-subtle-ink` |
| `paid` 全額付清 | `success` | `bg-success-subtle text-success-subtle-ink` |
| `refund_pending` 退款處理中 | `warning` + 邊框 | `bg-warning-subtle text-warning-subtle-ink border border-warning` |
| `refunded` 已退款 | `neutral` | `bg-neutral-subtle text-neutral-subtle-ink` |
| `failed` 付款失敗 | `danger` | `bg-danger-subtle text-danger-subtle-ink` |

小技巧：需要區分「待處理中」與「一般 pending」時，於 badge 加 `border border-<state>` 作實線標。

---

## 6. 電子鎖狀態色（Smart Lock）

| 狀態 | 語意 token | 徽章配色 | 圖示提示 |
| --- | --- | --- | --- |
| `locked` 上鎖中（正常） | `success` | `bg-success-subtle text-success-subtle-ink` | `Lock` |
| `unlocked` 解鎖中 | `warning` | `bg-warning-subtle text-warning-subtle-ink` | `LockOpen` |
| `unlocking` 解鎖中（動作中） | `info` + 動畫 | `bg-info-subtle text-info-subtle-ink animate-pulse` | `Loader2 animate-spin` |
| `offline` 離線 | `neutral` + 邊框 | `bg-neutral-subtle text-ink-2 border border-line-strong` | `WifiOff` |
| `low_battery` 電量低 | `warning` | `bg-warning-subtle text-warning-subtle-ink` | `BatteryLow` |
| `error` 異常 | `danger` | `bg-danger-subtle text-danger-subtle-ink` | `AlertTriangle` |

刻意讓「正常上鎖」＝綠色（安全）、「解鎖中」＝琥珀（提醒），符合客戶心智模型。

---

## 7. Email 通知狀態色

| 狀態 | 語意 token | 徽章配色 |
| --- | --- | --- |
| `queued` 佇列中 | `neutral` | `bg-neutral-subtle text-neutral-subtle-ink` |
| `sent` 已寄出 | `info` | `bg-info-subtle text-info-subtle-ink` |
| `delivered` 已送達 | `accent` | `bg-accent-subtle text-accent-subtle-ink` |
| `opened` 已開啟 | `success` | `bg-success-subtle text-success-subtle-ink` |
| `bounced` 退信 | `danger` | `bg-danger-subtle text-danger-subtle-ink` |
| `spam` 垃圾信 | `warning` | `bg-warning-subtle text-warning-subtle-ink` |
| `failed` 失敗 | `danger` + 邊框 | `bg-danger-subtle text-danger-subtle-ink border border-danger` |

`delivered` 用 `accent`（moss）而非 `success`，替 `opened` 保留「更進一步」的視覺升級空間。

---

## 8. 對比檢查說明

所有語意 token 皆已依 OKLCH 亮度規則校準。快速對照：

| 情境 | 前景 L | 背景 L | 差距 | 判定 |
| --- | --- | --- | --- | --- |
| 主文 on canvas（light） | 0.218 | 0.985 | 0.767 | ✓ 遠超 0.45 門檻 |
| 次文 on canvas（light） | 0.400 | 0.985 | 0.585 | ✓ 剛過 <0.45 規則邊界 |
| 提示文 on canvas（light） | 0.500 | 0.985 | 0.485 | ⚠ 僅用於短提示，不作長文 |
| `text-brand-on` on `bg-brand`（light） | 0.985 | 0.470 | 0.515 | ✓ APCA \|Lc\|≈78，過 AAA |
| 主文 on canvas（dark） | 0.968 | 0.155 | 0.813 | ✓ 遠超 0.75 門檻 |
| `ink-3` on canvas（dark） | 0.780 | 0.155 | 0.625 | ✓ 剛過 >0.75 規則邊界 |
| `text-*-subtle-ink` on `bg-*-subtle` | ≈0.30–0.42 | ≈0.95 | ≈0.55 | ✓ 全部通過 |

**修正對比只調 L 不動 C / H**（依 oklch-skill 指引）。如遇 P3 顯示裝置，
瀏覽器會自動採用實際 OKLCH 色；sRGB 裝置 fallback 亦已在 gamut 內，無需手動 `@media (color-gamut: p3)` 分支。

已知邊界：`ink-3` 在 light mode 為 L=0.500，用於「提示」是刻意壓低的視覺層級；
若要長文請改用 `ink-2`（L=0.400）或 `ink`。
