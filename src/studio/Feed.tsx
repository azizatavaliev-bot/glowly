import { useMemo, useRef, useState } from 'react'
import { savePng } from './png'
import data from '../data/products.json'
import type { Product } from '../types'
import { som } from '../pricing'
import { OPT_MIN } from '../mode'
import { Highlight, HIGHLIGHTS, SLIDES } from './highlights'
import { LOGO_VARIANT } from '../brand'
import Logo from '../components/Logo'
import { Post, caption, type PostInput, type PostType } from './posts'
import { ReelCover } from './Format'
import './studio.css'
import './format.css'
import './feed.css'

/**
 * Превью профиля Instagram — служебная страница /feed: 54 публикации по плану недели,
 * как они встанут в сетку и в ленту. Посты рисуются кодом студии /insta, рилсы — обложками из /format.
 */
const ALL = data.products as Product[]
const byId = (id: number) => ALL.find(p => p.id === id)!

type Item =
  | { kind: 'post'; input: PostInput }
  | { kind: 'reel'; id: number; top: string; big: string; cap: string }

const post = (type: PostType, ids: number[], title = '', faq = 0): Item =>
  ({ kind: 'post', input: { type, items: ids.map(byId), title, faq, logo: LOGO_VARIANT, cut: true, opt: true } })
const reel = (id: number, top: string, big: string, cap: string): Item => ({ kind: 'reel', id, top, big, cap })

// 12 недель по 6 публикаций (72): Пн рилс-хит · Вт товар · Ср рилс опт · Чт польза · Пт рилс новинка · Сб подборка/уход
export const PLAN: Item[] = [
  reel(528, 'Бестселлер', 'Reedle Shot 100', 'Сыворотка с микроиглами, о которой спрашивают чаще всего. На складе — в объёме.'),
  post('товар', [528]),
  reel(427, 'Склад LILO', 'Корейский уход оптом', 'Более 500 позиций из Кореи — в наличии в Бишкеке. Без коробов, любым набором.'),
  post('совет', [528]),
  reel(33, 'Новинка', 'Anua PDRN 100', 'Сыворотка с капсулами PDRN — новое поступление Anua.'),
  post('подборка', [534, 510, 32, 64], 'Хиты LILO'),

  reel(427, 'Солнцезащита', 'Каждый день', 'Round Lab Birch Juice — лёгкий SPF, который берут постоянно.'),
  post('товар', [427]),
  reel(284, 'Склад LILO', 'Всё в наличии', 'То, что вы видите на складе, можно заказать сегодня.'),
  post('вопрос', [528], '', 0),
  reel(286, 'Новинка', 'Medicube PDRN Pink', 'Крем с розовыми капсулами — новое поступление Medicube.'),
  post('уход', [566, 440, 174, 427]),

  reel(33, 'Тренд сезона', 'PDRN', '37 средств с PDRN в наличии — полка тренда за один заказ.'),
  post('товар', [33]),
  reel(174, 'Условия', 'Без коробов', 'Собирайте заказ из разных позиций — от 15 000 с в сумме.'),
  post('совет', [174]),
  reel(87, 'Новинка', 'Beauty of Joseon', 'Relief Sun — солнцезащитный крем с рисом и пробиотиками.'),
  post('подборка', [33, 762, 763, 286], 'Тренд PDRN'),

  reel(32, 'Бестселлер', 'Niacinamide 10%', 'Anua Niacinamide + TXA — сыворотку спрашивают по названию.'),
  post('товар', [32]),
  reel(102, 'Процесс', 'Сборка заказа', 'Как собирается оптовый заказ: от корзины на сайте до коробки.'),
  post('вопрос', [427], '', 1),
  reel(770, 'Новинка', 'Anua Retinol 0.3', 'Мягкий ретинол с ниацинамидом — новое поступление Anua.'),
  post('товар', [284]),

  reel(174, 'Зимний уход', 'Dr.Althea 345', 'Крем для раздражённой кожи — время пополнить полку к холодам.'),
  post('товар', [174]),
  reel(475, 'Как заказать', 'Две минуты', 'Каталог на сайте, корзина, заказ в WhatsApp. Чем больше сумма, тем выгоднее цена.'),
  post('совет', [440]),
  reel(13, 'Подарки', 'Наборы к празднику', 'Подарочные наборы Anua, Axis-Y и Beauty of Joseon — в наличии к декабрю.'),
  post('подборка', [13, 764, 814, 762], 'Наборы к празднику'),

  reel(534, 'Для салонов', 'VT PDRN Essence', 'Эссенция PDRN 100 — премиальная позиция для профессионального ухода.'),
  post('товар', [534]),
  reel(64, 'Оригинал', 'Только из Кореи', 'Корейская маркировка, штрихкод, свежий срок годности.'),
  post('вопрос', [32], '', 0),
  reel(811, 'Новинка', 'Уход за глазами', 'Medicube PDRN Pink Peptide — крем для кожи вокруг глаз.'),
  post('уход', [808, 32, 65, 427]),

  reel(440, 'Бестселлер', 'Round Lab Dokdo', 'Тонер, который подходит почти любой коже.'),
  post('товар', [440]),
  reel(112, 'Ассортимент', '37 брендов', 'Anua, VT, Round Lab, Medicube, SKIN1004 и ещё 32 бренда — в одном месте.'),
  post('совет', [475]),
  reel(818, 'Новинка', 'Medicube NAD', 'Сыворотка с NAD — новое направление Medicube.'),
  post('подборка', [770, 773, 102, 760], 'Ретинол без страха'),

  reel(102, 'Ретинал', 'Celimax Vita-A', 'Компактный бустер с ретиналом — доступная позиция с быстрым оборотом.'),
  post('товар', [22]),
  reel(510, 'Доставка', 'По Бишкеку', 'Заказ собран и бережно упакован.'),
  post('вопрос', [174], '', 0),
  reel(821, 'Новинка', 'Medipeel Hyaluron 9', 'Гидрогелевые патчи для глаз — 60 штук в банке.'),
  post('товар', [812]),

  reel(286, 'Текстура', 'Розовые капсулы', 'Medicube PDRN Pink — крем, который красиво смотрится на полке.'),
  post('товар', [64]),
  reel(358, 'Опт', 'Партиями', 'Популярные позиции — в объёме, без ограничений по коробам.'),
  post('совет', [112]),
  reel(816, 'Новинка', 'Medicube Kojic', 'Линия с койевой кислотой и куркумой для ровного тона.'),
  post('подборка', [87, 427, 475, 86], 'Стена SPF'),

  reel(566, 'Очищение', 'SKIN1004 Centella', 'Гидрофильное масло с центеллой — первый шаг ухода.'),
  post('товар', [759]),
  reel(334, 'Бестселлер', 'Medipeel Peptide 9', 'Тонер-эссенция с пептидами — постоянная позиция на полке.'),
  post('совет', [334]),
  reel(764, 'Новинка', 'Anua Peach 70', 'Гидрогелевые маски с ниацинамидом — новое поступление Anua.'),
  post('подборка', [762, 764, 814, 766], 'Маски и патчи'),

  reel(173, 'Барьер', 'Dr.Althea 147', 'Крем для сухой кожи — пара к 345 Relief.'),
  post('товар', [769]),
  reel(475, 'Солнцезащита', 'SKIN1004 Hyalu-Cica', 'Лёгкая солнцезащитная сыворотка для жирной кожи.'),
  post('вопрос', [334], '', 0),
  reel(761, 'Новинка', 'Anua PDRN Cream', 'Увлажняющий крем PDRN 100 — новое поступление Anua.'),
  post('уход', [759, 771, 33, 761]),

  reel(510, 'Для салонов', 'VT PDRN Capsule', 'Крем с капсулами PDRN — премиальная позиция.'),
  post('товар', [760]),
  reel(112, 'Восстановление', 'Celimax Noni', 'Ампула с нони — для уставшей кожи.'),
  post('совет', [102]),
  reel(13, 'Ассортимент', 'Наборы Anua', 'Discovery-наборы Anua — удобный формат для знакомства с брендом.'),
  post('подборка', [528, 534, 510, 33], 'Линия PDRN'),
]

// описание профиля: 150 символов, первая строка — кто мы, дальше условия
export const NAME = 'LILO · корейская косметика оптом'
export const CATEGORY = 'Оптовая компания'
export const BIO = '🇰🇷 Оригиналы из Кореи · склад в Бишкеке\n📦 500+ позиций в наличии · 37 брендов\n💰 Опт от 15 000 с — без коробов\n👇 Оптовый прайс и заказ на сайте'

const START = new Date(2026, 9, 20) // понедельник, 20 октября 2026
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
export const dateOf = (i: number) => {
  const d = new Date(START)
  d.setDate(START.getDate() + Math.floor(i / 6) * 7 + (i % 6))
  return `${DAYS[i % 6]}, ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
}
export const capOf = (it: Item) => it.kind === 'post' ? caption(it.input)
  : `${it.cap}\n\nАктуальные оптовые цены и весь каталог — на lilo.asia/opt\nОпт от ${som(OPT_MIN)}, без коробов\n\n#корейскаякосметикаоптом #косметикаоптом #оптбишкек`

/** Плитка сетки 4:5. Рилс 9:16 обрезается до середины, как в профиле Instagram. */
export function Tile({ it, w }: { it: Item; w: number }) {
  // шахматка: в сетке из 3 колонок чередование по номеру = шахматный порядок; посты тёмные, рилсы светлые
  if (it.kind === 'post') return (
    <div className="tone-dark" style={{ width: w, height: w * 1.25, overflow: 'hidden' }}>
      <div style={{ transform: `scale(${w / 1080})`, transformOrigin: '0 0', width: 1080, height: 1350 }}><Post {...it.input} /></div>
    </div>
  )
  return (
    <div style={{ width: w, height: w * 1.25, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', top: -(w * 16 / 9 - w * 1.25) / 2 }}><ReelCover id={it.id} top={it.top} big={it.big} w={w} /></div>
      <span className="fd-reel">▶</span>
    </div>
  )
}

export default function Feed() {
  const [view, setView] = useState<'grid' | 'feed'>('grid')
  const [open, setOpen] = useState<number | null>(null)
  // в профиле новое сверху: последняя публикация плана — первая плитка
  const shown = useMemo(() => PLAN.map((it, i) => ({ it, i })).reverse(), [])
  const reels = PLAN.filter(p => p.kind === 'reel').length
  const [busy, setBusy] = useState(false)
  const [hl, setHl] = useState<string | null>(null)
  const [sl, setSl] = useState(0)
  const slRef = useRef<HTMLDivElement>(null)
  const slides = hl ? SLIDES[hl] : []
  const step = (d: number) => { const n = sl + d; if (n < 0) return; if (n >= slides.length) { setHl(null); return } setSl(n) }
  // все сторис кружка — в PNG 1080×1920
  const downloadSlides = async () => {
    if (!slRef.current || !hl) return
    setBusy(true)
    const label = HIGHLIGHTS.find(h => h.key === hl)!.label
    for (const [i, el] of (Array.from(slRef.current.children) as HTMLElement[]).entries()) {
      await savePng(el, 1080, 1920, `lilo ${label} ${i + 1}.png`)
      await new Promise(r => setTimeout(r, 300))
    }
    setBusy(false)
  }
  const hlRef = useRef<HTMLDivElement>(null)
  // обложка актуального в Instagram — сторис 1080×1920, в кружке видна середина
  const downloadHL = async () => {
    if (!hlRef.current) return
    setBusy(true)
    for (const el of Array.from(hlRef.current.children) as HTMLElement[]) {
      await savePng(el, 1080, 1920, `lilo актуальное ${el.dataset.label}.png`)
      await new Promise(r => setTimeout(r, 300))
    }
    setBusy(false)
  }

  return (
    <div className="fd">
      <aside className="fd-side">
        <Logo />
        <h1>Лента <em>опта</em></h1>
        <p>{PLAN.length} публикаций на 9 недель: {reels} рилсов и {PLAN.length - reels} постов, с 20 октября по 20 декабря.</p>
        <p>Новое в профиле — сверху, поэтому первая публикация плана внизу сетки. Нажмите на плитку — откроется пост с подписью и датой.</p>
        <div className="fd-legend"><b>Неделя</b>
          {['Пн — рилс: хит крупно', 'Вт — пост: товар', 'Ср — рилс: склад и опт', 'Чт — пост: совет или вопрос', 'Пт — рилс: новинка', 'Сб — пост: подборка или уход', 'Вс — только сторис'].map(s => <span key={s}>{s}</span>)}
        </div>
        <div className="fd-legend"><b>Обложки актуального</b>
          <div className="fd-hl">{HIGHLIGHTS.map(h => <div key={h.key}><Highlight h={h} size={44} /><span>{h.label}</span></div>)}</div>
          <button className="fd-dl" onClick={downloadHL} disabled={busy}>{busy ? 'Сохраняю…' : 'Скачать обложки 1080×1920'}</button>
        </div>
        <div className="fd-legend"><b>Описание профиля</b><pre className="fd-bio">{`Имя: ${NAME}\nКатегория: ${CATEGORY}\n\nОписание (${BIO.length} из 150):\n${BIO}\n\nСсылка: lilo.asia/opt`}</pre>
          <button className="fd-dl" onClick={() => navigator.clipboard.writeText(BIO)}>Скопировать описание</button>
          <p className="fd-tip">Переносы строк сохраняются, если вставить текст в поле «О себе» целиком. Имя, категория и ссылка — отдельные поля в настройках профиля.</p></div>
        <div className="fd-links"><a href="/format">Формат контента</a><a href="/insta">Студия постов</a></div>
      </aside>

      <main className="fd-phone">
        <div className="ig-top"><b>lilo.opt</b><span>≡</span></div>
        <div className="ig-head">
          <div className="ig-ava"><Logo caption={false} /></div>
          <div className="ig-stats"><div><b>{PLAN.length}</b>публикаций</div><div><b>—</b>подписчиков</div><div><b>—</b>подписок</div></div>
        </div>
        <div className="ig-bio"><span className="ig-name">{NAME}</span>{'\n'}<span className="ig-cat">{CATEGORY}</span>{BIO}{'\n'}<a>🔗 lilo.asia/opt</a></div>
        <div className="ig-btns"><span>Оптовый прайс</span><span>WhatsApp</span><span>Сайт</span></div>
        <div className="ig-hl">{HIGHLIGHTS.map(h => <button key={h.key} onClick={() => { setHl(h.key); setSl(0) }}><Highlight h={h} size={62} /><span>{h.label}</span></button>)}</div>
        <div className="ig-tabs"><button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}>▦ Сетка</button><button className={view === 'feed' ? 'on' : ''} onClick={() => setView('feed')}>☰ Лента</button></div>

        {view === 'grid' ? (
          <div className="ig-grid">{shown.map(({ it, i }) => (
            <button key={i} onClick={() => setOpen(i)} title={dateOf(i)}><Tile it={it} w={129} /></button>))}
          </div>
        ) : (
          <div className="ig-feed">{shown.map(({ it, i }) => (
            <article key={i}>
              <div className="ig-post-h"><i><Logo caption={false} /></i><b>lilo.opt</b><span>{dateOf(i)}</span></div>
              <Tile it={it} w={390} />
              <div className="ig-cap"><b>lilo.opt</b> {capOf(it)}</div>
            </article>))}
          </div>
        )}
      </main>

      <div ref={hlRef} className="fd-hl-src">{HIGHLIGHTS.map(h => (
        <div key={h.key} data-label={h.label} style={{ width: 1080, height: 1920, background: '#f7f4f0', display: 'grid', placeItems: 'center' }}>
          <Highlight h={h} size={720} />
        </div>))}
      </div>

      {hl && (
        <div className="st-view" onClick={() => setHl(null)}>
          <div className="st-box" onClick={e => e.stopPropagation()}>
            <div className="st-bars">{slides.map((_, i) => <i key={i} className={i <= sl ? 'on' : ''} />)}</div>
            <div style={{ transform: 'scale(.375)', transformOrigin: '0 0', width: 1080, height: 1920 }}>{slides[sl]}</div>
            <div className="st-tap"><button onClick={() => step(-1)} aria-label="Назад" /><button onClick={() => step(1)} aria-label="Дальше" /></div>
          </div>
          <div className="st-side" onClick={e => e.stopPropagation()}>
            <b>{HIGHLIGHTS.find(h => h.key === hl)!.label}</b>
            <span>Сторис {sl + 1} из {slides.length}. Нажмите справа — дальше, слева — назад.</span>
            <button onClick={downloadSlides} disabled={busy}>{busy ? 'Сохраняю…' : `Скачать все ${slides.length} сторис`}</button>
            <button onClick={() => setHl(null)}>Закрыть</button>
          </div>
          <div ref={slRef} className="fd-hl-src">{slides.map((s, i) => <div key={i} style={{ width: 1080, height: 1920 }}>{s}</div>)}</div>
        </div>
      )}

      {open !== null && (
        <div className="fd-modal" onClick={() => setOpen(null)}>
          <div className="fd-card" onClick={e => e.stopPropagation()}>
            <Tile it={PLAN[open]} w={430} />
            <div className="fd-meta">
              <span className="fd-date">№ {open + 1} · {dateOf(open)} · {PLAN[open].kind === 'reel' ? 'Reels' : 'пост'}</span>
              <pre>{capOf(PLAN[open])}</pre>
              <div className="fd-nav">
                <button disabled={open === 0} onClick={() => setOpen(open - 1)}>← раньше</button>
                <button disabled={open === PLAN.length - 1} onClick={() => setOpen(open + 1)}>позже →</button>
              </div>
              {PLAN[open].kind === 'reel' && <p className="fd-note">Обложка рилса. Сам ролик снимается по регламенту съёмки.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
