import type { Product } from './types'

/** Объём или вес из названия: 100ML, 50G, 60EA, 38G*4EA. */
const UNIT: Record<string, string> = { ML: 'мл', G: 'г', 'МЛ': 'мл', 'Г': 'г' }

export function volume(p: Product): { text: string; ml: number | null; count: number | null } {
  const n = p.full.toUpperCase()
  const pack = n.match(/(\d+(?:[.,]\d+)?)\s*(ML|G|МЛ|Г)\s*\*\s*(\d+)\s*(?:EA|ШТ)/)
  if (pack) {
    const one = parseFloat(pack[1].replace(',', '.'))
    const qty = Number(pack[3])
    return { text: `${pack[1]} ${UNIT[pack[2]]} × ${qty} шт`, ml: one * qty, count: qty }
  }
  const ea = n.match(/(\d+)\s*(?:EA|ШТ)\b/)
  const one = n.match(/(\d+(?:[.,]\d+)?)\s*(ML|G|МЛ|Г)\b/)
  if (one && ea) {
    return { text: `${one[1]} ${UNIT[one[2]]} · ${ea[1]} шт`, ml: parseFloat(one[1].replace(',', '.')), count: Number(ea[1]) }
  }
  if (one) {
    const v = parseFloat(one[1].replace(',', '.'))
    return { text: `${one[1]} ${UNIT[one[2]]}`, ml: v, count: null }
  }
  if (ea) return { text: `${ea[1]} шт в упаковке`, ml: null, count: Number(ea[1]) }
  return { text: '—', ml: null, count: null }
}

/** Что это за средство — по категории и словам в названии. */
export function what(p: Product): string {
  const v = volume(p)
  const size = v.text !== '—' ? `, ${v.text}` : ''
  const base: Record<string, string> = {
    'Уход за лицом': 'Средство базового ухода за лицом',
    'Очищение': 'Средство для очищения кожи',
    'Маски и патчи': 'Маска или патчи для интенсивного ухода',
    'Солнцезащита': 'Солнцезащитное средство для лица',
    'Макияж': 'Декоративная косметика',
    'Губы': 'Уход и цвет для губ',
    'Волосы': 'Уход за волосами и кожей головы',
    'Тело': 'Уход за телом',
    'Гигиена': 'Средство гигиены',
    'Наборы': 'Готовый набор из нескольких средств',
    'Гаджеты': 'Устройство для домашних процедур',
    'БАДы': 'Продукт для приёма внутрь',
  }
  return `${base[p.cat] ?? 'Средство ухода'} от ${p.brand}${size}.`
}

type Tag = { label: string; text: string }

const RULES: [RegExp, string, string][] = [
  [/SPF\s*50|SPF50/i, 'SPF 50', 'Высокая защита от ультрафиолета — база для ежедневного ухода'],
  [/SPF\s*30/i, 'SPF 30', 'Средняя защита от ультрафиолета'],
  [/PDRN/i, 'PDRN', 'Полинуклеотиды — работают на восстановление и плотность кожи'],
  [/NIACINAMIDE|НИАЦИНАМИД/i, 'Ниацинамид', 'Выравнивает тон, помогает с постакне и жирным блеском'],
  [/HYALURON|ГИАЛУРОН/i, 'Гиалуроновая кислота', 'Притягивает влагу и удерживает её в коже'],
  [/COLLAGEN|КОЛЛАГЕН/i, 'Коллаген', 'Про упругость и плотность кожи'],
  [/RETINOL|RETINAL|РЕТИНОЛ/i, 'Ретиноиды', 'Обновление кожи, морщины и текстура. Применять вечером'],
  [/CICA|CENTELLA|ЦЕНТЕЛЛ/i, 'Центелла (CICA)', 'Успокаивает раздражение, для чувствительной кожи'],
  [/VITAMIN\s*C|АСКОРБ/i, 'Витамин C', 'Сияние и работа с пигментацией'],
  [/AZELAIC|АЗЕЛАИН/i, 'Азелаиновая кислота', 'Против покраснений и высыпаний'],
  [/\bAHA\b|\bBHA\b|\bPHA\b|SALICYLIC|GLYCOLIC/i, 'Кислоты', 'Мягкое отшелушивание, чистые поры'],
  [/TEA\s*TREE|ЧАЙНОГО ДЕРЕВА/i, 'Чайное дерево', 'Для жирной и проблемной кожи'],
  [/CERAMIDE|КЕРАМИД/i, 'Керамиды', 'Восстанавливают защитный барьер кожи'],
  [/PEPTIDE|ПЕПТИД/i, 'Пептиды', 'Антивозрастной уход'],
  [/PANTHENOL|ПАНТЕНОЛ/i, 'Пантенол', 'Заживляет и снимает сухость'],
  [/MUGWORT|ПОЛЫН|ARTEMISIA/i, 'Полынь', 'Успокаивающий состав корейской классики'],
  [/RICE|РИСОВ/i, 'Рис', 'Питание и мягкое осветление тона'],
  [/PROPOLIS|ПРОПОЛИС|HONEY|МЁД/i, 'Прополис и мёд', 'Питание для сухой и уставшей кожи'],
  [/SNAIL|УЛИТ/i, 'Муцин улитки', 'Регенерация и увлажнение'],
  [/ALOE|АЛОЭ/i, 'Алоэ', 'Лёгкое увлажнение и охлаждение'],
  [/HEARTLEAF|ХАУТТЮ/i, 'Хауттюйния', 'Снимает воспаления, для проблемной кожи'],
  [/TXA|TRANEXAMIC/i, 'Транексамовая кислота', 'Работает с пигментными пятнами'],
]

export function tags(p: Product): Tag[] {
  const n = `${p.full} ${p.spec ?? ''}`
  const out: Tag[] = []
  for (const [re, label, text] of RULES) {
    if (re.test(n) && !out.some(t => t.label === label)) out.push({ label, text })
    if (out.length === 5) break
  }
  return out
}

/** Куда средство встаёт в уходе. */
export function howTo(p: Product): string {
  const n = p.full.toUpperCase()
  if (/SUNSCREEN|СОЛНЦЕЗАЩИТ|SPF/.test(n)) return 'Последний шаг утреннего ухода, перед макияжем. Обновлять днём.'
  if (/CLEANSING|ПЕНКА|ГЕЛЬ ДЛЯ УМЫВАНИЯ|ОЧИЩЕНИ|ГИДРОФИЛЬН/.test(n)) return 'Первый шаг: смыть макияж и загрязнения, затем тоник.'
  if (/TONER|ТОНЕР|ПЭДЫ/.test(n)) return 'После умывания — подготовить кожу к сыворотке и крему.'
  if (/SERUM|AMPOULE|СЫВОРОТКА|ЭССЕНЦИЯ|АМПУЛ/.test(n)) return 'После тоника, до крема. Несколько капель на влажную кожу.'
  if (/CREAM|КРЕМ|ЭМУЛЬСИЯ|ГЕЛЬ-КРЕМ/.test(n)) return 'Завершает уход: закрывает влагу после сыворотки.'
  if (/MASK|МАСКА|ПАТЧ/.test(n)) return 'Курсом 2–3 раза в неделю после очищения.'
  if (/SHAMPOO|ШАМПУНЬ|ВОЛОС/.test(n)) return 'На влажные волосы, тщательно смыть.'
  return 'Стандартная схема ухода: очищение → тоник → сыворотка → крем.'
}

/** Деньги: короб, цена за мл, ориентир розницы. */
export function money(p: Product, markup = 1.8) {
  const v = volume(p)
  const box = p.packQty ? p.price * p.packQty : null
  const perMl = v.ml ? p.price / v.ml : null
  return {
    box,
    boxQty: p.packQty,
    perMl,
    retail: p.price * markup,
    marginPerItem: p.price * markup - p.price,
  }
}
