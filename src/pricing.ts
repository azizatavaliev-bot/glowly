import type { Product } from './types'

/**
 * Цены для покупателя — в сомах.
 * Прайс склада в долларах, поэтому: курс × розничный коэффициент.
 * Коэффициент 1.42 = цена города (+58% к оптовой) минус 10% — мы всегда дешевле магазина.
 */
export const RATE = 87.5          // сом за доллар, проверять перед показом
export const RETAIL_K = 1.42

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
