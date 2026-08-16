# 環境設定

最後更新：2026-08-10

## Local Ports

前台：

```text
http://localhost:5173
```

後台：

```text
http://localhost:5174
```

後端 CORS 目前應允許：

```text
localhost:5173
localhost:5174
```

## Frontend Env

前台 `apps/booking-web/.env.local`：

```env
VITE_API_BASE_URL=https://cv3op1ht.cgapps.dev/api
VITE_API_KEY=<api-key>
```

後台 `apps/admin-web/.env.local`：

```env
VITE_API_BASE_URL=https://cv3op1ht.cgapps.dev/api
VITE_API_KEY=<api-key>
```

## Mock Mode

只有明確設定時才使用 mock：

```env
VITE_USE_MOCK=true
```

部署環境不要設定 `VITE_USE_MOCK=true`，否則會看到假資料。

## Build

前台 repo：

```bash
npm run build --workspace @studio/booking-web
```

後台 repo：

```bash
npm run build --workspace @studio/admin-web
```

## Sandbox Notes

如果 sandbox 出現：

```text
src/api/index.ts
src/api/schema.json
```

先確認是否是 git 追蹤檔：

```bash
git ls-files src/api
git status --short
```

目前本 repo 不追蹤 root `src/api`，也沒有 codegen script 產生它。若 sandbox 重新出現，通常是平台產生的 auxiliary/scaffold 檔。

## Admin Account

目前已知後台登入：

```text
admin@gmail.com
```

密碼由專案管理者保管，不應寫入 repo 文件。

