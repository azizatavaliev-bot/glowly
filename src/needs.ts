import type { Product } from './types'
import { split } from './name'

/**
 * Полки «по задаче» вместо технических категорий.
 * Человек думает «мне бы от прыщей», а не «очищение / уход за лицом».
 *
 * Полки двух видов:
 *  - задача кожи (прыщи, тон, морщины…) — ищем слова в названии, но ТОЛЬКО среди ухода за лицом:
 *    иначе «CICA» у кушона и «TEA TREE» у шампуня попадают в «От прыщей»;
 *  - раздел (солнце, волосы, макияж…) — берём по категории товара, слова тут только путают.
 */
export type Need = { key: string; label: string; emoji: string; re: RegExp; cats?: string[] }

// где вообще уместны задачи кожи лица
const FACE = ['Уход за лицом', 'Очищение', 'Маски и патчи', 'Наборы']

export const NEEDS: Need[] = [
  // центелла — это про успокоение, а не про прыщи: она ушла в «Чувствительной коже»
  { key: 'acne', label: 'От прыщей', emoji: '🎯', re: /ACNE|АКНЕ|TROUBLE|BLEMISH|SPOT (COVER |CARE )?(MICRODART )?PATCH|ПРЫЩ|ВЫСЫПАН|ПРОБЛЕМН|СПОТ ПАТЧ|TEA[\s-]?TR|ЧАЙНЫМ ДЕРЕВОМ|AZELAIC|SUCCINIC|SALICYL/i },
  { key: 'moist', label: 'Увлажнение', emoji: '💧', re: /MOISTUR|HYDRAT|HYDRO|УВЛАЖН|AQUA|HYAL|ГИАЛУРОН|WATERY|WATERMIDE|BIRCH|БЕРЁЗОВ/i },
  // «TONE» без уточнения ловил каждый TONER, «VITA» — ретинол (Vita-A): берём tone-up, пятна и витамин C
  { key: 'tone', label: 'Ровный тон', emoji: '✨', re: /BRIGHT|WHITENING|\bWHITE\b|GLOW|ILLUMINAT|RADIAN|TONE[\s-]?UP|EVEN TONE|NIACIN|VITAMIN\s*C|VITA\b(?![\s-]*A\b)|TXA|DARK SPOT|MELA|KOJIC|GLUTATHIONE|ПИГМЕНТ|СИЯН|ОСВЕТЛ/i },
  { key: 'age', label: 'От морщин', emoji: '⏳', re: /WRINKLE|LIFT|\bFIRM|COLLAGEN|PEPTIDE|RETIN|BAKUCHIOL|PLUMP|REJU|\bAGE\b|NAD\+|[\s-]TOX|GINSENG|ЖЕНЬШЕН|МОРЩИН|ЛИФТИНГ|ПОДТЯЖК|PDRN|EXOSOME/i },
  { key: 'pore', label: 'Поры и чёрные точки', emoji: '🫧', re: /PORE|BLACKHEAD|ОЧИЩЕНИЯ ПОР|СКРАБ|ПИЛИНГ|PEELING|\bAHA\b|\bBHA\b|\bPHA\b|ЭНЗИМН|CLAY|\bMUD\b|KAOLIN|ГЛИНЯН|SEBUM/i },
  { key: 'calm', label: 'Чувствительной коже', emoji: '🌿', re: /SOOTHING|CALMING|SENSITIVE|УСПОКА|ЧУВСТВИТЕЛЬН|REDNESS|RELIEF|PANTHENOL|MUGWORT|ПОЛЫН|HEARTLEAF|CICA|ЦЕНТЕЛЛ|(?<!MADAGASCAR )CENTELLA|MADECASSOSIDE|BARRIER|CERAMIDE|CERA-NOL|\bMILD\b/i },
  { key: 'sun', label: 'Защита от солнца', emoji: '☀️', re: /./, cats: ['Солнцезащита'] },
  { key: 'clean', label: 'Очищение', emoji: '🧼', re: /./, cats: ['Очищение'] },
  { key: 'mask', label: 'Маски и патчи', emoji: '🧖', re: /./, cats: ['Маски и патчи'] },
  { key: 'hair', label: 'Волосы', emoji: '💇', re: /./, cats: ['Волосы'] },
  { key: 'makeup', label: 'Макияж и губы', emoji: '💄', re: /./, cats: ['Макияж', 'Губы'] },
  { key: 'gift', label: 'Наборы в подарок', emoji: '🎁', re: /./, cats: ['Наборы'] },
]

const text = (p: Product) => `${p.full} ${p.spec ?? ''}`

function fits(p: Product, need: Need): boolean {
  if (need.cats) {
    if (need.cats.includes(p.cat)) return true
    const title = split(p).title.toLowerCase()
    // наборы масок лежат в «Наборах», щётка для головы — в «Гаджетах»: по смыслу им место и здесь
    if (need.key === 'mask') return /набор.*масок/.test(title)
    if (need.key === 'hair') return /расческа|расчёска/.test(title)
    return false
  }
  if (!FACE.includes(p.cat) || !need.re.test(text(p))) return false
  // крем для век с чайным деревом покупают не от прыщей
  if (need.key === 'acne' && /глаз|век/i.test(split(p).title)) return false
  return true
}

export function hasNeed(p: Product, key: string): boolean {
  const need = NEEDS.find(n => n.key === key)
  return need ? fits(p, need) : true
}

export function countNeed(products: Product[], key: string): number {
  const need = NEEDS.find(n => n.key === key)
  if (!need) return products.length
  return products.filter(p => fits(p, need)).length
}
