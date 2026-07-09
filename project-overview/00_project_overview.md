# 河日 Ode Studio 攝影棚預約系統 — Project Overview

## 專案目標

建立一套攝影棚預約系統，包含：

1. `booking-web`：前台預約網站
2. `admin-web`：後台管理網站
3. `packages/shared`：共用 types、API client、utils、UI primitives
4. `schema.sql`：資料庫 schema

網站使用 React 架構完成。

## 品牌資訊

- 中文名稱：河日
- 英文名稱：Ode Studio
- 參考風格：https://www.instagram.com/lans.lifehourse

## 專案背景

使用者承租一個公寓樓層，要做成攝影棚。攝影棚會有自然光、佈景、空間介紹，也會提供 24H 線上預約。

## 設計方向

這不是一般租借場地網站，也不是 SaaS landing page。

品牌氣質：

- 高級但不浮誇
- 安靜、克制、留白
- 自然光、公寓、河道附近、日常感
- 像藝廊、日系選物店、生活風格雜誌、獨立攝影師 portfolio 的結合
- 高級感來自比例、字體、留白、圖片裁切、色彩細節與互動質感

避免：

- 黑金高級感
- 網美風模板
- SaaS 藍
- 滿版大標語 + CTA 模板
- 過度商業促銷
- 看起來像旅館、婚攝場地、共享辦公室

## 技術棧建議

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- TanStack Query
- React Hook Form
- Zod
- Zustand 或 Context
- date-fns
- clsx
- lucide-react

## Monorepo 結構

```text
studio-booking-system/
  apps/
    booking-web/
    admin-web/
  packages/
    shared/
      api/
      types/
      utils/
      ui/
  schema.sql
```
