import type { Product } from './types'

/**
 * Полки «по задаче» вместо технических категорий.
 * Человек думает «мне бы от прыщей», а не «очищение / уход за лицом».
 */
export type Need = { key: string; label: string; emoji: string; re: RegExp }

export const NEEDS: Need[] = [
  { key: 'acne', label: 'От прыщей', emoji: '🎯', re: /ACNE|АКНЕ|TROUBLE|BLEMISH|SPOT|ПРЫЩ|ВЫСЫПАН|CICA|ЦЕНТЕЛЛ|TEA\s*TREE|AZELAIC/i },
  { key: 'moist', label: 'Увлажнение', emoji: '💧', re: /MOISTUR|HYDRAT|УВЛАЖН|AQUA|HYALURON|ГИАЛУРОН|WATER/i },
  { key: 'tone', label: 'Ровный тон', emoji: '✨', re: /BRIGHT|WHITENING|GLOW|TONE|NIACIN|VITAMIN\s*C|TXA|ПИГМЕНТ|СИЯН/i },
  { key: 'age', label: 'От морщин', emoji: '⏳', re: /WRINKLE|LIFTING|FIRMING|COLLAGEN|PEPTIDE|RETINOL|МОРЩИН|ЛИФТИНГ|PDRN|EXOSOME/i },
  { key: 'pore', label: 'Поры и чёрные точки', emoji: '🫧', re: /PORE|BLACKHEAD|ПОР[ЫА]|СКРАБ|ПИЛИНГ|\bAHA\b|\bBHA\b|\bPHA\b/i },
  { key: 'calm', label: 'Чувствительной коже', emoji: '🌿', re: /SOOTHING|CALMING|SENSITIVE|УСПОКА|ЧУВСТВИТЕЛЬН|REDNESS|PANTHENOL|MUGWORT|ПОЛЫН|HEARTLEAF/i },
  { key: 'sun', label: 'Защита от солнца', emoji: '☀️', re: /SUNSCREEN|СОЛНЦЕЗАЩИТ|SPF/i },
  { key: 'clean', label: 'Очищение', emoji: '🧼', re: /CLEANS|ПЕНКА|УМЫВАН|FOAM|ГИДРОФИЛЬН|МИЦЕЛЛЯР/i },
  { key: 'mask', label: 'Маски и патчи', emoji: '🧖', re: /MASK|МАСК|PATCH|ПАТЧ/i },
  { key: 'hair', label: 'Волосы', emoji: '💇', re: /ВОЛОС|SHAMPOO|ШАМПУН|SCALP|КОНДИЦИОНЕР|ПЕРХОТ/i },
  { key: 'makeup', label: 'Макияж и губы', emoji: '💄', re: /ТИНТ|ПОМАД|КУШОН|ТУШЬ|РУМЯН|ТЕНИ|ПАЛЕТКА|ДЛЯ ГУБ|БЛЕСК/i },
  { key: 'gift', label: 'Наборы в подарок', emoji: '🎁', re: /НАБОР|\bSET\b|\bKIT\b/i },
]

const text = (p: Product) => `${p.full} ${p.spec ?? ''} ${p.cat}`

export function hasNeed(p: Product, key: string): boolean {
  const need = NEEDS.find(n => n.key === key)
  return need ? need.re.test(text(p)) : true
}

export function countNeed(products: Product[], key: string): number {
  const need = NEEDS.find(n => n.key === key)
  if (!need) return products.length
  return products.filter(p => need.re.test(text(p))).length
}
