/**
 * scene.ts
 * 佈景型別，對應 schema 的 scenes / scene_images。
 */
import type { ID, DateString } from './common'

export interface SceneImage {
  id: ID
  sceneId: ID
  url: string
  altText?: string
  caption?: string
  isCover: boolean
  displayOrder: number
}

export interface Scene {
  id: ID
  studioId: ID
  slug: string
  name: string
  description?: string
  tags: string[]
  displayOrder: number
  isActive: boolean
  images: SceneImage[]
  coverUrl?: string
  createdAt: DateString
  updatedAt: DateString
}
