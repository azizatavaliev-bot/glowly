import type { Product } from './types'
import top from './data/top.json'

/** Топ-15 от владельца: место в списке задаёт порядок на витрине (поле price — его старые цены, не используются). */
export const TOP: Record<number, { rank: number; price: number }> = Object.fromEntries(
  (top as { rank: number; id: number; price: number }[]).map(t => [t.id, { rank: t.rank, price: t.price }]),
)
export const topRank = (p: Product): number | null => TOP[p.id]?.rank ?? null

/** Каталог собирается из прайса «по наличию», поэтому всё, что в нём есть, — на руках. */
export const inStock = (_p: Product): boolean => true
export const ORDER_DAYS = '7–14 дней'

/**
 * Цены для покупателя — в сомах.
 * Прайс склада в долларах, поэтому: курс × розничный коэффициент.
 * Наценка 40% на все товары без исключений — решение владельца от 08.10.2026.
 * Цены из top.json больше не применяются: список задаёт только порядок на витрине.
 */
export const RATE = 87.5          // сом за доллар, проверять перед показом
export const RETAIL_K = 1.40

/** Розничная цена в сомах, округлённая до десятков. */
export function price(p: Product): number {
  return Math.round(p.price * RATE * RETAIL_K / 10) * 10
}

/** Цена «как в городе» — для честного сравнения, сколько человек экономит. */
export function cityPrice(p: Product): number {
  return Math.round(p.price * RATE * 1.58 / 10) * 10
}

export function saving(p: Product): number {
  return cityPrice(p) - price(p)
}

export const som = (n: number) => `${n.toLocaleString('ru-RU')} с`
