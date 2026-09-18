import type { Product } from './types'

/** Ссылки на фото товара: сначала собранные hi-res, потом превью из прайса. */
export function photos(p: Product): string[] {
  const list = (p.photos ?? []).map(f => `/photos/${f}`)
  if (list.length) return list
  return p.img ? [`/img/${p.img}`] : []
}

export function cover(p: Product): string | null {
  return photos(p)[0] ?? null
}
