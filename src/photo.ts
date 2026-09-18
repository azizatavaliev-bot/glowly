import type { Product } from './types'

// на GitHub Pages сайт лежит в подпапке — пути к файлам строим от базы
const BASE = import.meta.env.BASE_URL

/** Ссылки на фото товара: сначала собранные hi-res, потом превью из прайса. */
export function photos(p: Product): string[] {
  const list = (p.photos ?? []).map(f => `${BASE}photos/${f}`)
  if (list.length) return list
  return p.img ? [`${BASE}img/${p.img}`] : []
}

export function cover(p: Product): string | null {
  return photos(p)[0] ?? null
}
