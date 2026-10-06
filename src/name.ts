import type { Product } from './types'

/**
 * В прайсе название — капсом и вперемешку: «АМПУЛА ДЛЯ ЛИЦА AZ A1 CALMING AMPOULE 30ML».
 * Человеку показываем русскую часть обычным регистром, латиницу — подписью.
 */
const RU = /[А-Яа-яЁё]/

function human(s: string): string {
  const lower = s.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// сокращения, которые в косметике принято писать капсом
const KEEP = new Set(['SPF', 'PA', 'PDRN', 'AHA', 'BHA', 'PHA', 'LHA', 'TXA', 'UV', 'EX', 'VT', 'AZ', 'HA', 'EGF',
  'BB', 'CC', 'IQ', 'UIQ', 'CP', 'NMF', 'EXP', 'XL', 'DNA', 'NAD', 'II', 'III'])

/** «BIRCH JUICE SUNSCREEN SPF50+ 50ML» → «Birch Juice Sunscreen SPF50+ 50ml»: капс подряд читать тяжело. */
function pretty(latin: string): string {
  return latin.split(' ').map(w => {
    if (/^\d+([.,]\d+)?(ML|G|EA|MG|PCS|P)\b/i.test(w)) return w.toLowerCase()      // объём и штуки
    const core = w.replace(/[^A-Za-z]/g, '')
    if (!core || KEEP.has(core.toUpperCase()) || /\d/.test(w) && core.length <= 3) return w
    return w.toLowerCase().replace(/(^|[-/&+.'(])([a-z])/g, (_, a, b) => a + b.toUpperCase())
  }).join(' ')
}

export function split(p: Product): { title: string; sub: string } {
  const words = p.name.trim().split(/\s+/)
  const ru: string[] = []
  let i = 0
  while (i < words.length && (RU.test(words[i]) || /^\d+%?$/.test(words[i]))) {
    ru.push(words[i]); i++
  }
  // число на стыке относится к латинскому названию: «4 IN 1», «345 RELIEF CREAM»
  while (ru.length > 1 && i < words.length && /^\d+%?$/.test(ru[ru.length - 1])) { ru.pop(); i-- }
  const rest = words.slice(i).join(' ')
  if (!ru.length) return { title: human(p.name), sub: '' }
  return { title: human(ru.join(' ')), sub: pretty(rest) }
}

/** Одной строкой — для заголовков, сообщений в WhatsApp и подписей. */
export function full(p: Product): string {
  const { title, sub } = split(p)
  return sub ? `${title} ${sub}` : title
}
