# OKLCH Theme 與 UI Design Tokens

## 目標

使用 OKLCH 建立攝影棚預約系統的色彩系統。

已設定 `oklch-skill`，請完整使用 OKLCH，不要只給 hex。

## 品牌色彩方向

品牌：河日 / Ode Studio

空間氣質：

- 公寓樓層
- 靠近河道
- 自然光
- 生活感
- 藝廊感
- 日系選物店
- 生活風格雜誌

色彩方向：

- 米白
- 暖灰
- 河水灰藍
- 霧藍
- 低彩度棕灰
- 晨光淡米色
- 深石墨灰
- 柔和邊框色
- 安靜但清楚的狀態色

避免：

- SaaS 藍
- 電商紅
- 黑金高級感
- 網美粉
- 奶茶色模板
- 過度鮮豔 alert colors
- Bootstrap 預設色
- Tailwind 預設藍色系

## 必須輸出

請輸出：

1. `src/styles/theme.css`
2. Tailwind v4 `@theme` tokens
3. Light mode tokens
4. Dark mode tokens
5. Button / Input / Card / Badge / Calendar / Table 顏色規範
6. 預約狀態色
7. 付款狀態色
8. 電子鎖狀態色
9. Email 狀態色
10. 對比檢查說明

## Semantic Tokens

### Background

- `--color-background`
- `--color-surface`
- `--color-surface-muted`
- `--color-surface-elevated`
- `--color-overlay`

### Text

- `--color-foreground`
- `--color-foreground-muted`
- `--color-foreground-subtle`
- `--color-foreground-inverse`

### Brand

- `--color-brand`
- `--color-brand-muted`
- `--color-brand-foreground`
- `--color-accent`
- `--color-accent-muted`

### Border

- `--color-border`
- `--color-border-strong`
- `--color-ring`

### Status

- `--color-success`
- `--color-success-muted`
- `--color-warning`
- `--color-warning-muted`
- `--color-danger`
- `--color-danger-muted`
- `--color-info`
- `--color-info-muted`

### Booking

- `--color-booking-available`
- `--color-booking-limited`
- `--color-booking-full`
- `--color-booking-closed`
- `--color-booking-selected`

### Payment

- `--color-payment-unpaid`
- `--color-payment-pending`
- `--color-payment-paid`
- `--color-payment-failed`
- `--color-payment-refunded`

## Base Token Draft

可以使用以下 tokens 作為基礎，但可以依照 OKLCH skill 檢查後微調。

```css
@theme {
  --color-background: oklch(0.982 0.006 85);
  --color-foreground: oklch(0.245 0.012 75);

  --color-surface: oklch(0.958 0.008 82);
  --color-surface-muted: oklch(0.928 0.009 78);
  --color-surface-elevated: oklch(0.992 0.004 85);

  --color-brand: oklch(0.52 0.035 215);
  --color-brand-muted: oklch(0.86 0.025 215);
  --color-brand-foreground: oklch(0.98 0.006 85);

  --color-accent: oklch(0.68 0.04 72);
  --color-accent-muted: oklch(0.9 0.025 78);

  --color-foreground-muted: oklch(0.45 0.012 75);
  --color-foreground-subtle: oklch(0.62 0.01 75);
  --color-foreground-inverse: oklch(0.97 0.005 85);

  --color-border: oklch(0.86 0.008 80);
  --color-border-strong: oklch(0.72 0.01 80);
  --color-ring: oklch(0.62 0.035 215);

  --color-success: oklch(0.54 0.055 155);
  --color-success-muted: oklch(0.91 0.025 155);

  --color-warning: oklch(0.68 0.08 80);
  --color-warning-muted: oklch(0.92 0.035 85);

  --color-danger: oklch(0.56 0.075 28);
  --color-danger-muted: oklch(0.91 0.028 28);

  --color-info: oklch(0.56 0.045 230);
  --color-info-muted: oklch(0.9 0.025 230);

  --color-booking-available: oklch(0.58 0.045 160);
  --color-booking-limited: oklch(0.68 0.06 82);
  --color-booking-full: oklch(0.62 0.018 75);
  --color-booking-closed: oklch(0.78 0.006 75);
  --color-booking-selected: oklch(0.52 0.035 215);

  --color-payment-unpaid: oklch(0.62 0.018 75);
  --color-payment-pending: oklch(0.68 0.06 82);
  --color-payment-paid: oklch(0.54 0.055 155);
  --color-payment-failed: oklch(0.56 0.075 28);
  --color-payment-refunded: oklch(0.56 0.035 285);
}
```

## Dark Mode Draft

```css
.dark {
  --color-background: oklch(0.18 0.01 75);
  --color-foreground: oklch(0.92 0.006 85);

  --color-surface: oklch(0.225 0.012 75);
  --color-surface-muted: oklch(0.27 0.012 75);
  --color-surface-elevated: oklch(0.255 0.014 75);

  --color-brand: oklch(0.72 0.035 215);
  --color-brand-muted: oklch(0.32 0.025 215);
  --color-brand-foreground: oklch(0.16 0.01 75);

  --color-accent: oklch(0.76 0.045 72);
  --color-accent-muted: oklch(0.31 0.025 78);

  --color-foreground-muted: oklch(0.76 0.006 85);
  --color-foreground-subtle: oklch(0.62 0.006 85);
  --color-foreground-inverse: oklch(0.18 0.01 75);

  --color-border: oklch(0.34 0.01 75);
  --color-border-strong: oklch(0.46 0.012 75);
  --color-ring: oklch(0.72 0.035 215);

  --color-success: oklch(0.72 0.055 155);
  --color-success-muted: oklch(0.3 0.025 155);

  --color-warning: oklch(0.76 0.07 80);
  --color-warning-muted: oklch(0.32 0.03 85);

  --color-danger: oklch(0.68 0.07 28);
  --color-danger-muted: oklch(0.32 0.03 28);

  --color-info: oklch(0.72 0.045 230);
  --color-info-muted: oklch(0.31 0.025 230);

  --color-booking-available: oklch(0.72 0.05 160);
  --color-booking-limited: oklch(0.76 0.06 82);
  --color-booking-full: oklch(0.56 0.012 75);
  --color-booking-closed: oklch(0.42 0.008 75);
  --color-booking-selected: oklch(0.72 0.035 215);

  --color-payment-unpaid: oklch(0.62 0.012 75);
  --color-payment-pending: oklch(0.76 0.06 82);
  --color-payment-paid: oklch(0.72 0.055 155);
  --color-payment-failed: oklch(0.68 0.07 28);
  --color-payment-refunded: oklch(0.72 0.04 285);
}
```

## Claude 執行要求

請務必使用 OKLCH tokens 作為基礎，並用 oklch-skill 檢查：

- 色彩比例
- 對比
- Dark mode
- Tailwind v4 `@theme`
- Calendar 狀態色
- 表單 focus ring
- Button hover / active / disabled
