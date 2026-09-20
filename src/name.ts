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

export function split(p: Product): { title: string; sub: string } {
  const words = p.name.trim().split(/\s+/)
  const ru: string[] = []
  let i = 0
  while (i < words.length && (RU.test(words[i]) || /^\d+%?$/.test(words[i]))) {
    ru.push(words[i]); i++
  }
  const rest = words.slice(i).join(' ')
  if (!ru.length) return { title: human(p.name), sub: '' }
  return { title: human(ru.join(' ')), sub: rest }
}

/** Одной строкой — для заголовков, сообщений в WhatsApp и подписей. */
export function full(p: Product): string {
  const { title, sub } = split(p)
  return sub ? `${title} ${sub}` : title
}
