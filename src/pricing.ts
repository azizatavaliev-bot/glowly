import type { Product } from './types'
import top from './data/top.json'
import { OPT } from './mode'

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
 * Розница: прайс + 45% (16.10.2026, Азиз: «чтобы накидка была хорошая»; до этого было +40%).
 * При закупке со скидкой 6% это +54% к себестоимости, 35% с каждой продажи остаётся до расходов.
 * Цены из top.json больше не применяются: список задаёт только порядок на витрине.
 */
export const RATE = 87.5          // сом за доллар, проверять перед показом
export const RETAIL_K = 1.45
/**
 * Опт: +15% к себестоимости на всё (20.10.2026, решение Азиза). Себестоимость = прайс склада − 6%,
 * поэтому коэффициент к прайсу 0.94 × 1.15 ≈ 1.081. Ступеней по сумме нет — одна оптовая цена.
 */
export const COST_K = 0.94
export const OPT_MARKUP = 0.15
export const OPT_TIERS = [{ from: 0, k: COST_K * (1 + OPT_MARKUP), label: 'от 15 000 с' }]
export const OPT_K = OPT_TIERS[0].k

const round10 = (n: number) => Math.round(n / 10) * 10

/** Оптовая цена товара на заданной ступени. */
export const optPrice = (p: Product, k = OPT_K): number => round10(p.price * RATE * k)

/** Ступень опта для суммы заказа, посчитанной по цене первой ступени. */
export const optTier = (base: number) => [...OPT_TIERS].reverse().find(t => base >= t.from) ?? OPT_TIERS[0]

/** Розничная цена в сомах, округлённая до десятков. */
export const retail = (p: Product): number => round10(p.price * RATE * RETAIL_K)

/** Цена, которую видит посетитель: на /opt оптовая, в остальных случаях розничная. */
export function price(p: Product): number {
  return OPT ? optPrice(p) : retail(p)
}

/** Зачёркнутая цена для сравнения: в рознице — «как в городе», в опте — наша розница. */
export function cityPrice(p: Product): number {
  return OPT ? retail(p) : round10(p.price * RATE * 1.58)
}

export function saving(p: Product): number {
  return cityPrice(p) - price(p)
}

export const som = (n: number) => `${n.toLocaleString('ru-RU')} с`

/**
 * Доллары рядом с оптовой ценой (23.10.2026, Азиз: «где цены оптовые — рядом в долларах»).
 * Считаются от прайса склада напрямую (прайс × 0.94 × 1.15), а не обратно из округлённых сомов.
 */
export const usd = (n: number) => `$${n.toFixed(2).replace('.', ',')}`
export const optUsd = (p: Product, k = OPT_K): number => Math.round(p.price * k * 100) / 100
/** Цена строкой: в рознице только сомы, на опте — «1 160 с · $13,30». */
export const money = (p: Product): string => OPT ? `${som(price(p))} · ${usd(optUsd(p))}` : som(price(p))
/** Сумма списка товаров в долларах по оптовой цене. */
export const usdSum = (items: { p: Product; qty: number }[], k = OPT_K): number =>
  Math.round(items.reduce((s, r) => s + optUsd(r.p, k) * r.qty, 0) * 100) / 100
