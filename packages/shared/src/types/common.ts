/**
 * common.ts
 * 系統共用基礎型別。ID 對應 schema 的 INTEGER PK。
 */
export type ID = number

export interface ApiResponse<T> { data: T }

export interface PaginationParams { page?: number; pageSize?: number }

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

/** ISO 8601 datetime 字串 */
export type ISODateTime = string
/** yyyy-MM-dd 日期字串 */
export type DateString = string
