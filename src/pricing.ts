import type { Product } from './types'
import top from './data/top.json'

/** Топ-15 от владельца: место в списке и его цена в сомах, формула для них не работает. */
export const TOP: Record<number, { rank: number; price: number }> = Object.fromEntries(
  (top as { rank: number; id: number; price: number }[]).map(t => [t.id, { rank: t.rank, price: t.price }]),
)
export const topRank = (p: Product): number | null => TOP[p.id]?.rank ?? null

/** Физически на руках только топ-15; всё остальное везём под заказ со склада. */
export const inStock = (p: Product): boolean => !!TOP[p.id]
export const ORDER_DAYS = '7–14 дней'

/**
 * Цены для покупателя — в сомах.
 * Прайс склада в долларах, поэтому: курс × розничный коэффициент.
 * Коэффициент 1.42 = цена города (+58% к оптовой) минус 10% — мы всегда дешевле магазина.
 */
export const RATE = 87.5          // сом за доллар, проверять перед показом
export const RETAIL_K = 1.42

/** Розничная цена в сомах, округлённая до десятков. */
export function price(p: Product): number {
  if (TOP[p.id]) return TOP[p.id].price
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
