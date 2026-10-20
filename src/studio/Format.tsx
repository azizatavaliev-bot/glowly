import data from '../data/products.json'
import type { Product } from '../types'
import { split } from '../name'
import { LOGO_VARIANT } from '../brand'
import Logo from '../components/Logo'
import { Post, type PostInput, type PostType } from './posts'
import './studio.css'
import './format.css'

/**
 * Формат контента LILO — служебная страница /format: всё, что утверждаем перед публикацией.
 * Посты рисуются тем же кодом, что в студии /insta, поэтому утверждённое = то, что потом скачивается.
 */
const ALL = data.products as Product[]
const byId = (id: number) => ALL.find(p => p.id === id)!
const post = (type: PostType, ids: number[], title = 'Хиты LILO', faq = 0): PostInput =>
  ({ type, items: ids.map(byId), title, faq, logo: LOGO_VARIANT, cut: true })

/** Пост в уменьшенном виде: рисуется 1080×1350 и сжимается, как в студии. */
function Mini({ input, w = 260 }: { input: PostInput; w?: number }) {
  return (
    <div className="fm-mini" style={{ width: w, height: w * 1.25 }}>
      <div style={{ transform: `scale(${w / 1080})`, transformOrigin: '0 0', width: 1080, height: 1350 }}><Post {...input} /></div>
    </div>
  )
}

/** Обложка рилса 9:16: товар без фона, крупная суть, «в наличии». В сетке профиля видна центральная часть 4:5. */
export function ReelCover({ id, top, big, w = 200 }: { id: number; top: string; big: string; w?: number }) {
  const p = byId(id)
  return (
    <div className="fm-mini" style={{ width: w, height: w * 16 / 9 }}>
      <div className="m reel" style={{ transform: `scale(${w / 1080})`, transformOrigin: '0 0', width: 1080, height: 1920 }}>
        <div className="hd"><div className="lg-box"><Logo caption={false} /></div><div className="lb">reels</div></div>
        <div className="r-top">{top}</div>
        <div className="r-big">{big}</div>
        <div className="ph"><img className="cut" src={`/cut/${p.id}.webp`} alt="" /></div>
        <div className="ft"><span>{p.brand} · в наличии</span><span>lilo.asia</span></div>
      </div>
    </div>
  )
}

/** Сторис 9:16: один товар, цена опта и розницы, место под стикер-ссылку снизу. */
function Story({ id, w = 200 }: { id: number; w?: number }) {
  const p = byId(id)
  return (
    <div className="fm-mini" style={{ width: w, height: w * 16 / 9 }}>
      <div className="m reel story" style={{ transform: `scale(${w / 1080})`, transformOrigin: '0 0', width: 1080, height: 1920 }}>
        <div className="hd"><div className="lg-box"><Logo caption={false} /></div><div className="lb">в наличии</div></div>
        <div className="ph"><img className="cut" src={`/cut/${p.id}.webp`} alt="" /></div>
        <div className="br">{p.brand}</div>
        <div className="tt">{split(p).title}</div>
        <div className="s-prices"><span>Актуальная цена и каталог — на сайте</span></div>
        <div className="s-link">lilo.asia ↗</div>
      </div>
    </div>
  )
}

// сетка профиля на 3 недели: товар — каждый второй пост, редакционные типы разбавляют
const GRID: PostInput[] = [
  post('товар', [528]), post('совет', [528]), post('товар', [427]),
  post('подборка', [534, 510, 32, 64], 'Хиты LILO'), post('товар', [33]), post('уход', [566, 440, 174, 427]),
  post('товар', [174]), post('вопрос', [427], '', 1), post('товар', [284]),
]

const TYPES_INFO: { type: PostType; input: PostInput; what: string; when: string }[] = [
  { type: 'товар', input: post('товар', [528]), what: 'Один товар: фото без фона, название, «цены и каталог на сайте». Основа ленты.', when: '3 раза в неделю' },
  { type: 'подборка', input: post('подборка', [534, 510, 32, 64], 'Хиты LILO'), what: 'Тема: хиты, PDRN, новинки. Главный товар крупно, остальные строкой.', when: '1 раз в неделю' },
  { type: 'совет', input: post('совет', [174]), what: 'Одна фраза курсивом и товар строкой. Сохраняют и пересылают.', when: '1 раз в неделю' },
  { type: 'вопрос', input: post('вопрос', [528]), what: 'Вопрос из директа и короткий ответ.', when: 'раз в 2 недели' },
  { type: 'уход', input: post('уход', [566, 440, 174, 427]), what: 'Схема из 3–4 средств по порядку. Продаёт сразу несколько товаров.', when: 'раз в 2 недели' },
]

const WEEK = [
  ['Пн', 'Reels: предметный ролик хита', 'товар'],
  ['Вт', 'Пост «Товар»', 'товар'],
  ['Ср', 'Reels: склад, объём или сборка заказа', 'опт'],
  ['Чт', 'Пост «Совет» или «Вопрос — ответ»', 'польза'],
  ['Пт', 'Reels: новинка — одно средство крупно', 'товар'],
  ['Сб', 'Пост «Подборка» или «Уход по шагам»', 'товар'],
  ['Вс', 'Только сторис: опрос, «угадай цену»', 'вовлечение'],
]

export default function Format() {
  return (
    <div className="fm">
      <header className="fm-head">
        <Logo />
        <div><h1>Формат контента <em>LILO</em></h1>
          <p>Всё, что утверждаем перед публикацией. Посты здесь собраны тем же кодом, что и в <a href="/insta">студии постов</a>: утвердили — там же скачали.</p></div>
      </header>

      <section className="fm-sec">
        <h2>1. Принцип</h2>
        <div className="fm-rules">
          <div><b>Герой — товар</b><span>Каждый пост и ролик про конкретный товар, который есть в наличии. Без абстрактных цитат и картинок «про красоту».</span></div>
          <div><b>Один товар в кадре</b><span>На одной картинке — один продукт. Подборка и уход: главный товар крупно, остальные строкой текста.</span></div>
          <div><b>Объём</b><span>В роликах видно, что товара много: коробы, ряды флаконов. Опт от 15 000 с.</span></div>
          <div><b>Всё ведёт на сайт</b><span>В каждом посте и сторис — lilo.asia. WhatsApp — вторым.</span></div>
        </div>
      </section>

      <section className="fm-sec">
        <h2>2. Фирменный стиль</h2>
        <div className="fm-brand">
          <div className="fm-card"><span className="fm-k">Логотип</span><div className="fm-logo"><Logo /></div><p>«lılo» с каплей над ı. На тёмном фоне — белым, капля остаётся терракотовой.</p></div>
          <div className="fm-card"><span className="fm-k">Цвета</span>
            <div className="fm-sw">{[['#f7f4f0', 'фон'], ['#16130f', 'текст'], ['#c0563c', 'акцент'], ['#9a9188', 'подписи'], ['#e3ddd5', 'линии']].map(([c, n]) =>
              <div key={c}><i style={{ background: c }} /><b>{n}</b><span>{c}</span></div>)}</div>
            <p>Акцентный цвет — только капля, одно слово курсивом и номера шагов. Не больше одного акцента на пост.</p></div>
          <div className="fm-card"><span className="fm-k">Шрифты</span>
            <div className="fm-type"><div style={{ fontFamily: 'Manrope', fontWeight: 500, fontSize: 30 }}>Manrope — основной</div>
              <div style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontSize: 32, color: '#c0563c' }}>Playfair — одно слово</div></div>
            <p>Заголовок — Manrope 500. Курсив Playfair — только для одного слова-акцента: «Хиты <em>LILO</em>», «Уход в 4 <em>шага</em>».</p></div>
        </div>
      </section>

      <section className="fm-sec">
        <h2>3. Как выглядит профиль</h2>
        <p className="fm-lead">Первые 9 постов в сетке. Товар — каждый второй пост, остальные типы разбавляют ленту, поэтому она не превращается в прайс.</p>
        <div className="fm-grid">{GRID.map((g, i) => <Mini key={i} input={g} w={240} />)}</div>
      </section>

      <section className="fm-sec">
        <h2>4. Пять типов постов</h2>
        <div className="fm-types">{TYPES_INFO.map(t => (
          <div key={t.type} className="fm-type-card"><Mini input={t.input} w={220} />
            <b>{t.type[0].toUpperCase() + t.type.slice(1)}</b><p>{t.what}</p><span>{t.when}</span></div>))}
        </div>
      </section>

      <section className="fm-sec">
        <h2>5. Обложки Reels и сторис</h2>
        <p className="fm-lead">Обложка рилса — в том же стиле, что посты: вверху мелкая строка, ниже крупная суть, в центре товар. В сетке профиля обрезается до 4:5, поэтому главное держим в середине.</p>
        <div className="fm-row">
          <ReelCover id={528} top="Бестселлер" big="Reedle Shot 100" />
          <ReelCover id={33} top="Тренд сезона" big="PDRN" />
          <ReelCover id={427} top="Склад LILO" big="Корейский уход оптом" />
          <Story id={284} />
          <Story id={32} />
        </div>
      </section>

      <section className="fm-sec">
        <h2>6. Неделя публикаций</h2>
        <table className="fm-week"><tbody>{WEEK.map(([d, w, k]) => <tr key={d}><td>{d}</td><td>{w}</td><td><span className={`fm-tag ${k}`}>{k}</span></td></tr>)}</tbody></table>
        <p className="fm-lead">Сторис — каждый день, 3–5 штук: процесс со склада, новинки, ответы на вопросы, ссылка на lilo.asia стикером.</p>
      </section>

      <section className="fm-sec">
        <h2>7. Подписи</h2>
        <div className="fm-rules">
          <div><b>Коротко</b><span>3–5 строк: что это, цена, «в наличии», как заказать. Длинные описания — на сайте.</span></div>
          <div><b>Цен в контенте нет</b><span>Ни на картинках, ни в подписях, ни в роликах. Везде призыв: «Актуальные цены и каталог — на lilo.asia».</span></div>
          <div><b>Без обещаний</b><span>Не «лечит» и не «гарантирует результат» — только что это и как применять.</span></div>
          <div><b>Два хештега</b><span>#косметикабишкек #корейскаякосметика. Больше не нужно.</span></div>
        </div>
      </section>

      <div className="fm-foot">Утверждаем этот формат — дальше посты собираются в <a href="/insta">студии</a>, ролики снимаются по регламенту.</div>
    </div>
  )
}
