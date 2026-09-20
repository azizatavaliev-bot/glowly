import type { Product } from './types'

/**
 * Поиск «как человек ищет»: по-русски, с опечатками в раскладке и синонимами.
 * Прайс на смеси русского и латиницы, поэтому запрос разворачиваем в набор слов
 * и ищем совпадение хотя бы одного варианта на каждое слово запроса.
 */

// «крем от прыщей» → надо найти ACNE, TROUBLE, BLEMISH
const SYNONYMS: [RegExp, string[]][] = [
  [/прыщ|акне|воспален|высыпан|угр/i, ['acne', 'trouble', 'blemish', 'spot', 'акне', 'cica']],
  [/пор[аыу]|чёрн|черн точк/i, ['pore', 'blackhead', 'пор']],
  [/увлажн|сух|обезвож/i, ['moistur', 'hydra', 'aqua', 'увлажн', 'hyaluron']],
  [/морщин|возраст|старен|лифтинг|подтяж/i, ['wrinkle', 'lifting', 'firming', 'collagen', 'peptide', 'морщин']],
  [/пигмент|пятн|тон|осветл|сиян/i, ['bright', 'whitening', 'glow', 'tone', 'txa', 'vitamin c']],
  [/жирн|блеск|матир/i, ['sebum', 'matte', 'oil control', 'жирн']],
  [/чувствительн|раздражен|краснот|покраснен/i, ['soothing', 'calming', 'cica', 'centella', 'успока']],
  [/солнц|загар|спф|уф/i, ['spf', 'sunscreen', 'солнцезащит', 'uv']],
  [/умыван|очищен|смыть макияж|пенк/i, ['cleans', 'foam', 'пенка', 'умыван', 'очищ']],
  [/маск|тканев/i, ['mask', 'маск']],
  [/патч|глаз|веки|отёк|отек/i, ['patch', 'eye', 'патч', 'глаз']],
  [/тоник|тонер|пэд/i, ['toner', 'pad', 'тонер', 'пэд']],
  [/сыворот|ампул|эссенц/i, ['serum', 'ampoule', 'essence', 'сыворотк', 'ампул', 'эссенц']],
  [/крем/i, ['cream', 'крем']],
  [/волос|шампун|выпаден|перхот/i, ['hair', 'shampoo', 'scalp', 'волос', 'выпаден']],
  [/губ|помад|тинт|блеск для губ/i, ['lip', 'tint', 'губ', 'помад', 'тинт']],
  [/тушь|ресниц/i, ['mascara', 'тушь']],
  [/подар|набор/i, ['set', 'kit', 'набор']],
  [/мужск|мужу|парн/i, ['men', 'homme', 'мужск']],
  [/барьер|восстанов|шелуш/i, ['barrier', 'ceramide', 'repair', 'барьер']],
]

// то же слово, набранное в английской раскладке: «rhtv» → «крем»
const LAYOUT: Record<string, string> = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з',
  a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л', l: 'д',
  z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь', ';': 'ж', "'": 'э', ',': 'б', '.': 'ю',
}
const toRu = (s: string) => s.replace(/[a-z;',.]/g, c => LAYOUT[c] ?? c)

// бренды люди пишут кириллицей: «анюа», «медикуб», «раунд лаб»
const BRANDS: [RegExp, string][] = [
  [/ан[юу]а/i, 'anua'], [/медикуб|медикьюб/i, 'medicube'], [/раунд\s*лаб/i, 'round lab'],
  [/скин\s*1004/i, 'skin1004'], [/биоданс/i, 'biodance'], [/дас[иы]к/i, 'dasique'],
  [/токобо/i, 'tocobo'], [/медипил/i, 'medipeel'], [/ниидли|нидли/i, 'needly'],
  [/бьюти\s*оф\s*джосон|бьюти\s*джосон/i, 'beauty of joseon'], [/мишша|миша/i, 'missha'],
  [/фармстей/i, 'farmstay'], [/селимакс/i, 'celimax'], [/ариул/i, 'ariul'],
  [/аксис|эксис/i, 'axis-y'], [/нумбузин|намбузин/i, 'numbuzin'], [/лагом/i, 'lagom'],
  [/хеймиш|хеймищ/i, 'heimish'], [/миксун/i, 'mixsoon'], [/ви\s*ти|вт\b/i, 'vt cosmetics'],
  [/др\.?\s*алтея|алтея/i, 'dr.althea'], [/медихил/i, 'mediheal'], [/парнел/i, 'parnell'],
]

/** Все строки товара, по которым имеет смысл искать. */
export function haystack(p: Product): string {
  return `${p.full} ${p.spec ?? ''} ${p.cat} ${p.brand}`.toLowerCase()
}

/** Варианты одного слова запроса: само слово, раскладка, синонимы. */
function variants(word: string): string[] {
  const out = new Set<string>([word])
  const ru = toRu(word)
  if (ru !== word) out.add(ru)
  for (const [re, list] of SYNONYMS) {
    if (re.test(word) || (ru !== word && re.test(ru))) list.forEach(v => out.add(v))
  }
  for (const [re, brand] of BRANDS) {
    if (re.test(word) || (ru !== word && re.test(ru))) out.add(brand)
  }
  // «кремом», «кремы» → «крем»: отрезаем окончание у длинных слов
  if (word.length > 5) out.add(word.slice(0, -1))
  if (word.length > 6) out.add(word.slice(0, -2))
  return [...out]
}

// предлоги и союзы только мешают: «крем от прыщей» — это про крем и прыщи
const STOP = new Set(['от', 'для', 'из', 'на', 'с', 'со', 'в', 'и', 'по', 'the', 'for'])

/** «раунд лаб» → «round lab»: имя бренда может быть из двух слов, ловим до разбивки. */
function normalize(query: string): string {
  let q = query.trim().toLowerCase()
  for (const [re, brand] of BRANDS) q = q.replace(re, brand)
  return q
}

export function matches(p: Product, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(w => w && !STOP.has(w))
  if (!words.length) return true
  const hay = haystack(p)
  return words.every(w => variants(w).some(v => hay.includes(v)))
}

/** Подсказки под строкой поиска — то, что люди спрашивают чаще всего. */
export const HINTS = [
  'от прыщей', 'увлажнение', 'солнцезащита', 'тонер', 'патчи',
  'от морщин', 'для волос', 'набор в подарок', 'тинт для губ',
]
