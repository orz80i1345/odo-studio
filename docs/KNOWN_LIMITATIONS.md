# 已知限制與注意事項

最後更新：2026-08-10

## CRUD API 限制

### Page Size

API pageSize 實際上限約為 100。

需要讀完整月份、完整列表時要分頁抓取，不能假設 `pageSize=1000` 會生效。

### No Group By

CRUD API 不提供 group by / aggregate summary。

因此前台月曆不應直接抓整月 `time_slots` 後每次都前端計算。已新增：

```text
studio_daily_availability
```

作為每日 summary cache。

### DATE 欄位

CRUD API 對 `DATE` 欄位寫入/查詢建議使用：

```text
YYYY-MM-DDT00:00:00Z
```

不要只送：

```text
YYYY-MM-DD
```

### JSONB 欄位

JSONB 欄位建議送字串：

```json
"{}"
```

不要送：

```json
{}
```

部分 endpoint 會因 Go SQL driver 無法直接處理 object 而失敗。

## Index UI 限制

目前 console index UI 無法設定 partial index：

```sql
WHERE is_cover = TRUE
```

因此 `scene_images` 不使用 partial unique index。封面唯一性由後台程式控制。

## Special Dates

只建立 `special_dates` 不足以阻止前台預約。

必須同步更新：

```text
time_slots.status
```

否則前台仍會看到 `available` slots。

## Daily Availability Sync

`studio_daily_availability` 是 cache，需要在異動後重算。

如果直接從 DB 或外部工具改 `time_slots`，但沒有同步更新 daily availability，前台月曆可能短時間顯示舊狀態。

處理方式：

- 後台操作會同步更新
- 前台預約/取消會嘗試同步更新
- 大量手動改 DB 後，應重新 rebuild summary table

