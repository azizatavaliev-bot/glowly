import data from '../data/products.json'
import type { Product } from '../types'
import { som, OPT_TIERS } from '../pricing'
import { OPT_MIN } from '../mode'
import { split } from '../name'
import Logo from '../components/Logo'

/**
 * «Актуальное» оптового профиля: обложки кружков и сторис внутри каждого.
 * Сторис 1080×1920 в стиле постов: светлый фон, товар без фона, одно слово курсивом.
 */
export type HL = { key: string; label: string; d: string; word: string; tone: 'cocoa' | 'sand' | 'cream' }

export const HIGHLIGHTS: HL[] = [
  { key: 'usl', label: 'Условия', d: 'M7 4h10l3 3v13H4V4h3zM8 11h8M8 15h6M8 7h4', word: 'опт', tone: 'cocoa' },
  { key: 'price', label: 'Цены', d: 'M20 12l-8 8-8-8V4h8l8 8zM8 8h.01', word: 'цены', tone: 'sand' },
  { key: 'hits', label: 'Хиты', d: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3z', word: 'хиты', tone: 'cream' },
  { key: 'new', label: 'Новинки', d: 'M12 4v16M4 12h16', word: 'new', tone: 'cocoa' },
  { key: 'sklad', label: 'Склад', d: 'M3 21V9l9-5 9 5v12M7 21v-7h10v7M7 17h10', word: 'склад', tone: 'sand' },
  { key: 'how', label: 'Как заказать', d: 'M5 7h14l-1 13H6L5 7zM9 7V5a3 3 0 0 1 6 0v2M9 13l2 2 4-4', word: 'заказ', tone: 'cream' },
  { key: 'ship', label: 'Доставка', d: 'M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01', word: 'доставка', tone: 'cocoa' },
]

const TONE = { cocoa: ['#3a2e25', '#1d1712', '#f3ede5'], sand: ['#efe5d8', '#d9c9b5', '#2a211b'], cream: ['#fbf8f3', '#e9e0d4', '#2a211b'] }

/** Обложка кружка: тональный круг и одно слово курсивной антиквой. Тона чередуются: какао, песок, крем. */
export function Highlight({ h, size }: { h: HL; size: number }) {
  const [a, b, ink] = TONE[h.tone]
  const id = `hg-${h.key}`
  const fs = h.word.length > 6 ? 13 : h.word.length > 4 ? 15.5 : 18
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-label={h.label}>
      <defs><radialGradient id={id} cx="38%" cy="32%" r="80%"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></radialGradient></defs>
      <circle cx="30" cy="30" r="30" fill={`url(#${id})`} />
      <circle cx="30" cy="30" r="25.5" fill="none" stroke={ink} strokeOpacity=".22" strokeWidth=".5" />
      <text x="30" y="31" textAnchor="middle" dominantBaseline="middle" fill={ink}
        style={{ fontFamily: 'Cormorant, serif', fontStyle: 'italic', fontWeight: 500, fontSize: fs }}>{h.word}</text>
      <path fill="#b9654a" d="M30 44.2c1 1.3 1.6 2.1 1.6 2.9a1.6 1.6 0 0 1-3.2 0c0-.8.6-1.6 1.6-2.9Z" />
    </svg>
  )
}

const ALL = data.products as Product[]
const byId = (id: number) => ALL.find(p => p.id === id)!
const latin = (p: Product) => split(p).sub.replace(/\s*\d+(?:[.,]\d+)?\s?(ml|g)\b.*$/i, '')
const Cut = ({ p }: { p: Product }) => <img className="cut" src={`/cut/${p.id}.webp`} alt="" />
const brands = new Set(ALL.map(p => p.brand)).size

function Frame({ label, children, tone = '' }: { label: string; children: React.ReactNode; tone?: '' | 'dark' | 'sand' }) {
  return (
    <div className={`m reel hs ${tone}`}>
      <div className="hd"><div className="lg-box"><Logo caption={false} /></div><div className="lb">{label}</div></div>
      {children}
      <div className="ft"><span>lilo.asia/opt</span><span>опт от {som(OPT_MIN)}</span></div>
    </div>
  )
}

/** Один товар на сторис: крупно, бренд, название, оптовая цена. Правило — один продукт в кадре. */
function One({ id, label, top, tone = '' }: { id: number; label: string; top: string; tone?: '' | 'dark' | 'sand' }) {
  const p = byId(id)
  return (
    <Frame label={label} tone={tone}>
      <div className="hs-top" style={{ marginTop: 90 }}>{top}</div>
      <div className="hs-one"><div className="ph"><Cut p={p} /></div>
        <div className="br">{p.brand}</div><div className="tt">{latin(p)}</div>
        <div className="hs-cta">Актуальная цена — <em>на сайте</em><span>lilo.asia/opt ↗</span></div></div>
    </Frame>
  )
}

/** Сторис внутри каждого кружка, по порядку показа. */
export const SLIDES: Record<string, React.ReactNode[]> = {
  usl: [
    <Frame label="условия" tone="dark"><div className="hs-mid"><div className="hs-top">Опт LILO</div><h2 className="hs-big">Корейская косметика <em>оптом</em></h2>
      <ul className="hs-list"><li>Минимальный заказ — {som(OPT_MIN)}</li><li>Без коробов: любой набор позиций</li><li>{ALL.length} позиций в наличии в Бишкеке</li><li>Только оригиналы из Кореи</li></ul></div></Frame>,
    <Frame label="условия" tone="sand"><div className="hs-mid"><div className="hs-top">Чем больше заказ</div><h2 className="hs-big">тем ниже <em>цена</em></h2>
      <div className="hs-tiers">{OPT_TIERS.map((t, i) => <div key={t.from}><span>{t.label}</span><b>{i === 0 ? 'оптовая цена' : 'цена ниже'}</b></div>)}</div></div></Frame>,
    <Frame label="условия"><div className="hs-mid"><div className="hs-top">У склада — коробами по 48 штук</div><h2 className="hs-big">У нас — <em>сколько нужно</em></h2>
      <p className="hs-p">Соберите заказ из разных брендов и позиций: 5 сывороток, 10 кремов, 3 набора. Главное — от {som(OPT_MIN)} в сумме.</p></div></Frame>,
  ],
  // цен в контенте нет: кружок «Цены» ведёт на сайт, где всегда актуальный прайс
  price: [
    <Frame label="цены" tone="dark"><div className="hs-mid"><div className="hs-top">Цены</div><h2 className="hs-big">Все актуальные цены — <em>на сайте</em></h2>
      <p className="hs-p">Прайс обновляется с каждой поставкой, поэтому цены мы не пишем в сторис и постах. На сайте — всегда свежие.</p><div className="hs-btn">lilo.asia/opt ↗</div></div></Frame>,
    <Frame label="цены" tone="sand"><div className="hs-mid"><div className="hs-top">Чем больше заказ</div><h2 className="hs-big">тем выгоднее <em>цена</em></h2>
      <div className="hs-tiers">{OPT_TIERS.map((t, i) => <div key={t.from}><span>{t.label}</span><b>{i === 0 ? 'оптовая цена' : 'цена ниже'}</b></div>)}</div>
      <p className="hs-p">Корзина на сайте сама пересчитает цену по сумме заказа.</p></div></Frame>,
  ],
  hits: [528, 427, 33, 32, 174].map((id, i) => <One id={id} label="хиты" top="Бестселлер" tone={i % 2 ? 'sand' : ''} />),
  new: [761, 770, 773, 816].map((id, i) => <One id={id} label="новинки" top="Новинка" tone={i % 2 ? '' : 'sand'} />),
  sklad: [
    <Frame label="склад" tone="sand"><div className="hs-mid"><div className="hs-top">Склад в Бишкеке</div><h2 className="hs-big"><em>{ALL.length}</em> позиций в наличии</h2>
      <div className="hs-nums"><div><b>{brands}</b>брендов</div><div><b>80</b>новинок в октябре</div></div>
      <p className="hs-p hs-note">Здесь будут фото и видео со съёмки склада</p></div></Frame>,
  ],
  how: [
    <Frame label="как заказать"><div className="hs-mid"><div className="hs-top">Заказ за 2 минуты</div><h2 className="hs-big">Как <em>заказать</em></h2>
      <ol className="hs-steps"><li>Откройте lilo.asia/opt — ссылка в профиле</li><li>Соберите корзину от {som(OPT_MIN)}</li><li>Нажмите «Отправить заказ» — откроется WhatsApp с готовым списком</li><li>Менеджер подтвердит наличие и доставку</li></ol></div></Frame>,
    <Frame label="как заказать" tone="dark"><div className="hs-mid"><h2 className="hs-big">Оптовый прайс — <em>на сайте</em></h2>
      <p className="hs-p">Все цены, ступени и наличие обновляются при каждой поставке.</p><div className="hs-btn">lilo.asia/opt ↗</div></div></Frame>,
  ],
  ship: [
    <Frame label="доставка"><div className="hs-mid"><div className="hs-top">Доставка</div><h2 className="hs-big">По <em>Бишкеку</em></h2>
      <p className="hs-p">Срок и стоимость доставки подтвердит менеджер в WhatsApp после заказа.</p><p className="hs-p hs-note">Условия доставки уточняются</p></div></Frame>,
  ],
}
