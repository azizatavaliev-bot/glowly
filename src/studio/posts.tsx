import { createContext, useContext, useState } from 'react'
import './rich.css'
import type { Product } from '../types'
import { cover } from '../photo'
import { som } from '../pricing'
import { OPT_MIN } from '../mode'
import { split } from '../name'
import Logo from '../components/Logo'
import type { LogoVariant } from '../brand'
import detailsJson from '../data/details.json'

/**
 * Пять минималистичных типов постов Instagram 1080×1350. Один фон, без плашек и кнопок;
 * акцент — логотип и одно слово курсивом. Тексты советов и вопросов — из details.json.
 */
type Details = { tip?: string; faq?: [string, string][] }
export const DETAILS = detailsJson as unknown as Record<string, Details>

export type PostType = 'товар' | 'подборка' | 'совет' | 'вопрос' | 'уход'
export const TYPES: { key: PostType; label: string; min: number; max: number; hint: string }[] = [
  { key: 'товар', label: 'Товар', min: 1, max: 1, hint: 'фото, название и цена' },
  { key: 'подборка', label: 'Подборка', min: 4, max: 4, hint: '4 товара на одну тему' },
  { key: 'совет', label: 'Совет', min: 1, max: 1, hint: 'фраза курсивом, только товары с описанием' },
  { key: 'вопрос', label: 'Вопрос — ответ', min: 1, max: 1, hint: 'частый вопрос, только товары с описанием' },
  { key: 'уход', label: 'Уход по шагам', min: 3, max: 4, hint: '3–4 средства по порядку нанесения' },
]

export type PostInput = { type: PostType; items: Product[]; title: string; faq: number; logo: LogoVariant; cut: boolean; opt?: boolean }

// включены ли фото без фона — переключатель в студии на случай, если товар вырезался криво
const CutCtx = createContext(true)
// оптовый режим: в посте оптовая цена первой ступени и подвал «опт от 15 000 с»
const OptCtx = createContext(false)

const title = (p: Product) => split(p).title
const latin = (p: Product) => split(p).sub.replace(/\s*\d+(?:[.,]\d+)?\s?(ml|g)\b.*$/i, '')
const step = (p: Product) => title(p).replace(/ для лица.*$/i, '').toLowerCase()

/** «Хиты LILO» → «Хиты <em>LILO</em>»: курсивом последнее слово. */
function Accent({ text }: { text: string }) {
  const w = text.trim().split(/\s+/)
  return <>{w.slice(0, -1).join(' ')} <em>{w[w.length - 1]}</em></>
}

function Head({ label, logo }: { label: string; logo: LogoVariant }) {
  return <div className="hd"><div className="lg-box"><Logo variant={logo} caption={false} /></div><div className="lb">{label}</div></div>
}
function Foot() {
  const opt = useContext(OptCtx)
  return <div className="ft"><span>{opt ? 'lilo.asia/opt' : 'lilo.asia'}</span><span>{opt ? `опт от ${som(OPT_MIN)}` : 'заказ в WhatsApp'}</span></div>
}
/**
 * Фото товара без фона: вырезанная версия из /cut (scripts/cutout.py). Если её нет — обычное фото,
 * подложка которого «растворяется» в фоне поста через multiply.
 */
function Img({ p }: { p: Product }) {
  const cut = useContext(CutCtx)
  const orig = cover(p) ?? ''
  const [failed, setFailed] = useState(false)
  if (!cut || failed) return <img src={orig} alt="" />
  return <img className="cut" src={`/cut/${p.id}.webp`} alt="" onError={() => setFailed(true)} />
}

function Line({ p }: { p: Product }) {
  return (
    <div className="ln">
      <div className="th"><Img p={p} /></div>
      <p><span>{p.brand}</span>{title(p)}</p>
    </div>
  )
}

export function Post(props: PostInput) {
  return <OptCtx.Provider value={!!props.opt}><CutCtx.Provider value={props.cut}><PostBody {...props} /></CutCtx.Provider></OptCtx.Provider>
}

function PostBody({ type, items, title: head, faq, logo, opt }: PostInput) {
  const p = items[0]
  if (!p) return <div className="m empty">Выберите товар слева</div>

  if (type === 'товар') return (
    <div className={`m t-${type}`}>
      <Head label={opt ? 'опт · в наличии' : 'в наличии'} logo={logo} />
      {/* люкс-композиция: товар небольшой и по центру, вокруг воздух; название — латиницей крупно */}
      <div className="lux">
        <div className="lux-ph"><Img p={p} /></div>
        <div className="br">{p.brand}</div>
        <div className="lux-name">{latin(p) || title(p)}</div>
        <div className="lux-type">{title(p)}</div>
        <div className="lux-cta">Цены и каталог — <em>на сайте</em></div>
      </div>
      <Foot />
    </div>
  )

  // правило: на одной картинке — один товар. Подборка = главный товар крупно, остальные строкой
  if (type === 'подборка') return (
    <div className={`m t-${type}`}>
      <Head label="подборка" logo={logo} />
      <h2><Accent text={head || 'Хиты LILO'} /></h2>
      <div className="ph pk-hero"><Img p={p} /></div>
      <ol className="pk-list">
        {items.slice(0, 4).map((x, i) => (
          <li key={x.id} className={i === 0 ? 'on' : ''}><i>{String(i + 1).padStart(2, '0')}</i><span><small>{x.brand}</small>{latin(x) || title(x)}</span></li>
        ))}
      </ol>
      <Foot />
    </div>
  )

  if (type === 'совет') return (
    <div className={`m t-${type}`}>
      <Head label="совет" logo={logo} />
      <div className="qt">{DETAILS[p.id]?.tip ?? 'У этого товара нет совета в описании'}</div>
      <Line p={p} />
      <div className="gap" /><Foot />
    </div>
  )

  if (type === 'вопрос') {
    const qa = DETAILS[p.id]?.faq?.[faq] ?? ['Вопросов к этому товару нет', '']
    return (
      <div className={`m t-${type}`}>
        <Head label="вопрос — ответ" logo={logo} />
        <div className="qq">{qa[0]}</div>
        <div className="aa">{qa[1]}</div>
        <Line p={p} />
        <div className="gap" /><Foot />
      </div>
    )
  }

  return (
    <div className={`m t-${type}`}>
      <Head label="уход" logo={logo} />
      <h2>Уход в {items.length} <em>шага</em></h2>
      <div className="ph pk-hero"><Img p={p} /></div>
      <ol className="pk-list">
        {items.map((x, i) => (
          <li key={x.id} className={i === 0 ? 'on' : ''}><i>{i + 1}</i><span><small>{step(x)}</small>{x.brand} {latin(x) || title(x)}</span></li>
        ))}
      </ol>
      <div className="gap" /><Foot />
    </div>
  )
}

const TAGS = '#косметикабишкек #корейскаякосметика'

/** Подпись к посту — коротко: что это, цена, как заказать. */
const OPT_TAGS = '#корейскаякосметикаоптом #косметикаоптом #оптбишкек #косметикабишкек'

/** Подпись к посту — коротко: что это, цена, как заказать. В опте — оптовая цена и условия. */
/**
 * Подпись к посту. Цен в контенте нет (решение Азиза 17.10): цены меняются с каждым прайсом,
 * поэтому в постах только призыв — актуальные цены и каталог на сайте.
 */
export function caption({ type, items, title: head, faq, opt }: PostInput): string {
  const p = items[0]
  if (!p) return ''
  const name = (x: Product) => `${x.brand} ${title(x)}`
  const tags = opt ? OPT_TAGS : TAGS
  const cta = opt
    ? `Актуальные оптовые цены и весь каталог — на lilo.asia/opt\nОпт от ${som(OPT_MIN)}, без коробов, из наличия в Бишкеке`
    : 'Актуальные цены и каталог — на lilo.asia'
  switch (type) {
    case 'товар':
      return `${name(p)}\n${split(p).sub}\n\n${opt ? 'В наличии в объёме' : 'В наличии в Бишкеке'}\n${cta}\n\n${tags}`
    case 'подборка':
      return `${head || 'Хиты LILO'}\n\n${items.map(x => `— ${name(x)}`).join('\n')}\n\n${cta}\n\n${tags}`
    case 'совет':
      return `${DETAILS[p.id]?.tip ?? ''}\n\n${name(p)}\n${cta}\n\n${tags}`
    case 'вопрос': {
      const qa = DETAILS[p.id]?.faq?.[faq]
      return `${qa?.[0] ?? ''}\n${qa?.[1] ?? ''}\n\n${name(p)}\n${cta}\n\n${tags}`
    }
    case 'уход':
      return `Уход в ${items.length} шага\n\n${items.map((x, i) => `${i + 1}. ${name(x)}`).join('\n')}\n\n${cta}\n\n${tags}`
  }
}
