# Repository Split

## 目前拆分

- `/Users/tang/Downloads/odo-studio`
  - 河日 Ode Studio 前台預約網站
  - 保留 `apps/booking-web`
  - 保留 `packages/shared`
  - 保留 `project-overview` markdown 與 schema 參考

- `/Users/tang/Downloads/odo-studio-backend-web`
  - 河日 Ode Studio 管理後台
  - 保留 `apps/admin-web`
  - 保留 `packages/shared`
  - 保留 `project-overview` markdown 與 schema 參考

## shared package

兩邊目前都各自保留一份 `packages/shared`，用來維持拆分後可以獨立開發與建置。

若未來要共用同一份 shared，可再改成獨立 npm package、git submodule，或搬到第三個 shared repo。

## 開發指令

前台：

```bash
cd /Users/tang/Downloads/odo-studio
npm run dev
```

管理後台：

```bash
cd /Users/tang/Downloads/odo-studio-backend-web
npm run dev
```
