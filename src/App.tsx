import { useEffect, useMemo, useRef, useState } from 'react'
import data from './data/products.json'
import type { Product, Meta } from './types'
import Card from './components/Card'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import ProductModal from './components/ProductModal'
import BrandPicker from './components/BrandPicker'
import Dropdown from './components/Dropdown'
import { useReveal } from './useReveal'
import { cover } from './photo'
import { price, som } from './pricing'
import { split } from './name'
import { matches, score, HINTS } from './search'
import { NEEDS, hasNeed, countNeed } from './needs'
import { saving } from './pricing'
import { useFavorites, useRecent } from './store'
import FavPanel from './components/FavPanel'
import Toast from './components/Toast'
import MobileBar from './components/MobileBar'
import RoutineBuilder from './components/RoutineBuilder'

const meta = data.meta as Meta
const all = data.products as Product[]

const WA = '996559050618'
const waLink = (text: string) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`

type Sort = 'name' | 'price-asc' | 'price-desc' | 'save'

export default function App() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Все')
  const [brand, setBrand] = useState('Все')
  const [sort, setSort] = useState<Sort>('name')
  const [onlySale, setOnlySale] = useState(false)
  const [need, setNeed] = useState('')
  const [maxPrice, setMaxPrice] = useState(0)   // 0 = без ограничения
  const [limit, setLimit] = useState(48)
  const [open, setOpen] = useState<Product | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)
  const [favOpen, setFavOpen] = useState(false)
  const fav = useFavorites()
  const recent = useRecent()
  const favItems = fav.ids.map(id => all.find(p => p.id === id)).filter((p): p is Product => !!p)
  const recentItems = recent.ids.map(id => all.find(p => p.id === id)).filter((p): p is Product => !!p)
  const [scrolled, setScrolled] = useState(false)
  const catalogRef = useRef<HTMLDivElement>(null)
  const toRoutine = () => document.getElementById('routine')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // ссылка вида ?p=123 открывает карточку товара сразу
  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get('p'))
    const found = id ? all.find(p => p.id === id) : null
    if (found) setOpen(found)
  }, [])

  useEffect(() => {
    const url = new URL(location.href)
    if (open) url.searchParams.set('p', String(open.id))
    else url.searchParams.delete('p')
    history.replaceState(null, '', url)
  }, [open])

  // клавиша «/» — быстрый переход в поиск, как в больших магазинах
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        const el = document.querySelector<HTMLInputElement>('.catalog .search')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => el?.focus(), 400)
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [])

  // фильтры в адресной строке: ссылку на «все тонеры до 1200 с» можно переслать
  useEffect(() => {
    const url = new URL(location.href)
    const set = (k: string, v: string | number, empty: string | number) =>
      v === empty ? url.searchParams.delete(k) : url.searchParams.set(k, String(v))
    set('q', q, '')
    set('need', need, '')
    set('brand', brand, 'Все')
    set('cat', cat, 'Все')
    set('max', maxPrice, 0)
    if (!open) history.replaceState(null, '', url)
  }, [q, need, brand, cat, maxPrice, open])

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    if (sp.get('q')) setQ(sp.get('q')!)
    if (sp.get('need')) setNeed(sp.get('need')!)
    if (sp.get('brand')) setBrand(sp.get('brand')!)
    if (sp.get('cat')) setCat(sp.get('cat')!)
    if (sp.get('max')) setMaxPrice(Number(sp.get('max')))
  }, [])

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('locked', !!open || brandOpen || favOpen)
  }, [open, brandOpen, favOpen])

  const cats = useMemo(() => {
    const c = new Map<string, number>()
    all.forEach(p => c.set(p.cat, (c.get(p.cat) ?? 0) + 1))
    return ['Все', ...[...c.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0])]
  }, [])
  const brands = useMemo(() => ['Все', ...Array.from(new Set(all.map(p => p.brand))).sort()], [])
  const brandCounts = useMemo(() => {
    const c: Record<string, number> = {}
    all.forEach(p => { c[p.brand] = (c[p.brand] ?? 0) + 1 })
    return c
  }, [])

  // в ленту акций — по одному товару на бренд, сначала самая большая скидка
  const sales = useMemo(() => {
    const pct = (p: Product) => Number(p.sale?.match(/(\d+)%/)?.[1] ?? 0)
    const seen = new Set<string>()
    return all
      .filter(p => p.sale && p.img)
      .sort((a, b) => pct(b) - pct(a))
      .filter(p => !seen.has(p.brand) && seen.add(p.brand))
      .slice(0, 12)
  }, [])

  // три ленты фото в шапке: по одному товару на бренд, чтобы витрина выглядела разной
  const columns = useMemo(() => {
    const seen = new Set<string>()
    const pool = all.filter(p => p.img && !seen.has(p.brand) && seen.add(p.brand))
    const cols: Product[][] = [[], [], []]
    pool.slice(0, 27).forEach((p, i) => cols[i % 3].push(p))
    return cols
  }, [])

  const list = useMemo(() => {
    const r = all.filter(p => {
      if (need && !hasNeed(p, need)) return false
      if (cat !== 'Все' && p.cat !== cat) return false
      if (brand !== 'Все' && p.brand !== brand) return false
      if (onlySale && !p.sale) return false
      if (maxPrice && price(p) > maxPrice) return false
      return matches(p, q)
    })
    if (q.trim() && sort === 'name') return [...r].sort((a, b) => score(b, q) - score(a, q))
    return [...r].sort((a, b) =>
      sort === 'price-asc' ? a.price - b.price :
      sort === 'price-desc' ? b.price - a.price :
      sort === 'save' ? saving(b) - saving(a) :
      a.name.localeCompare(b.name, 'ru'))
  }, [q, cat, brand, sort, onlySale, need, maxPrice])

  useEffect(() => { setLimit(48) }, [q, cat, brand, sort, onlySale, need, maxPrice])
  useReveal([list, limit])

  const toCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const pickBrand = (b: string) => { setBrand(b); setCat('Все'); toCatalog() }

  return (
    <>
      <header className={scrolled ? 'top solid' : 'top'}>
        <div className="wrap top-in">
          <button className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            GLOW<span>LY</span>
          </button>
          <button className="top-search" onClick={() => {
            const el = document.querySelector<HTMLInputElement>('.catalog .search')
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => el?.focus(), 400)
          }} aria-label="Поиск">🔍<span>Поиск</span></button>
          <div className="top-right">
            <span className="city">Бишкек</span>
            <button className="fav-btn" onClick={() => setFavOpen(true)} aria-label="Избранное">
              ♥{fav.ids.length > 0 && <b>{fav.ids.length}</b>}
            </button>
            <a className="cart-btn" href={waLink('Здравствуйте! Пишу с сайта GLOWLY — хочу спросить про косметику 🙂')}
              target="_blank" rel="noreferrer">
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </header>

      <Hero all={all} total={all.length} brands={brands.length - 1}
        columns={columns} onStart={toCatalog} onOpen={setOpen}
        onSearch={qq => { setQ(qq); setNeed(''); setCat('Все'); setBrand('Все'); toCatalog() }}
        wa={waLink('Здравствуйте! Пишу с сайта GLOWLY — помогите подобрать уход 🙂')} />

      <Marquee items={brands.slice(1)} onPick={pickBrand} />

      <section className="perks" data-reveal>
        <div className="wrap perks-in">
          <div><b>🇰🇷 Оригинал из Кореи</b><span>Везём напрямую со склада, без перекупов</span></div>
          <div><b>💸 Дешевле города</b><span>Цены ниже магазинных — сравнение в каждой карточке</span></div>
          <div><b>🚚 Доставка по Бишкеку</b><span>Привезём день в день, оплата при получении</span></div>
          <div><b>💬 Подберём уход</b><span>Напишите в WhatsApp — поможем выбрать под вашу кожу</span></div>
        </div>
      </section>

      {!!sales.length && (
        <section className="sales" data-reveal>
          <div className="wrap sales-head">
            <h2>Скидки недели</h2>
            <button className="link" onClick={() => { setOnlySale(true); toCatalog() }}>
              смотреть все →
            </button>
          </div>
          <div className="rail">
            {sales.map(p => (
              <button className="sale-card" key={p.id} onClick={() => setOpen(p)}>
                <img src={cover(p) ?? ''} alt={p.name} loading="lazy" />
                <span className="badge">{p.sale!.replace('АКЦИЯ ', '−').replace(/ [KS]$/, '')}</span>
                <b>{p.brand}</b>
                <i>{split(p).title}</i>
                <u>{som(price(p))}</u>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="needs" data-reveal>
        <div className="wrap">
          <h2 className="sec-title">Что вам нужно?</h2>
          <div className="need-grid">
            {NEEDS.map(n => (
              <button key={n.key}
                className={need === n.key ? 'need on' : 'need'}
                onClick={() => { setNeed(need === n.key ? '' : n.key); toCatalog() }}>
                <span>{n.emoji}</span>
                <b>{n.label}</b>
                <i>{countNeed(all, n.key)}</i>
              </button>
            ))}
          </div>
        </div>
      </section>

      <RoutineBuilder all={all} onOpen={setOpen} wa={waLink} />

      <div className="catalog" ref={catalogRef} id="catalog">
        <div className="wrap">
          <h2 className="sec-title" data-reveal>
            {need ? NEEDS.find(n => n.key === need)?.label : 'Каталог'}
          </h2>
        </div>

        <div className="sticky">
          <div className="wrap">
            <div className="tools">
              <div className="search-box">
                <input className="search" placeholder="Что ищете? «крем от прыщей», «тонер», ANUA…"
                  value={q} onChange={e => setQ(e.target.value)} />
                {q && <button className="clear" onClick={() => setQ('')} aria-label="Очистить">×</button>}
              </div>
              <button className={brand === 'Все' ? 'dd-btn wide' : 'dd-btn wide on'}
                onClick={() => setBrandOpen(true)}>
                {brand === 'Все' ? 'Все бренды' : brand}<span className="dd-arrow" />
              </button>
              <Dropdown value={sort} onChange={v => setSort(v as Sort)} options={[
                { value: 'name', label: 'По названию' },
                { value: 'price-asc', label: 'Сначала дешёвые' },
                { value: 'price-desc', label: 'Сначала дорогие' },
                { value: 'save', label: 'Самая большая выгода' },
              ]} />
              <label className="chk">
                <input type="checkbox" checked={onlySale} onChange={e => setOnlySale(e.target.checked)} />
                Только скидки
              </label>
            </div>
            <div className="hints">
              <span>Цена до:</span>
              {[800, 1200, 2000, 3500].map(v => (
                <button key={v} className={maxPrice === v ? 'hint on' : 'hint'}
                  onClick={() => setMaxPrice(maxPrice === v ? 0 : v)}>{som(v)}</button>
              ))}
              <span className="hint-sep" />
              <span>Часто ищут:</span>
              {HINTS.map(h => (
                <button key={h} className={q === h ? 'hint on' : 'hint'}
                  onClick={() => setQ(q === h ? '' : h)}>{h}</button>
              ))}
            </div>
            <div className="cats">
              {cats.map(c => (
                <button key={c} className={c === cat ? 'chip on' : 'chip'} onClick={() => setCat(c)}>
                  {c}<i>{c === 'Все' ? all.length : all.filter(p => p.cat === c).length}</i>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="wrap">
          <div className="found">
            Найдено: <b>{list.length}</b>
            {(brand !== 'Все' || cat !== 'Все' || onlySale || q || need || maxPrice > 0) && (
              <button className="link" onClick={() => { setBrand('Все'); setCat('Все'); setOnlySale(false); setQ(''); setNeed(''); setMaxPrice(0) }}>
                сбросить фильтры
              </button>
            )}
          </div>

          <div className="grid">
            {list.slice(0, limit).map((p, i) => (
              <Card key={p.id} p={p} delay={i % 12} onOpen={() => setOpen(p)} />
            ))}
          </div>

          {list.length > limit && (
            <button className="more" onClick={() => setLimit(l => l + 48)}>
              Показать ещё <b>{Math.min(48, list.length - limit)}</b> из {list.length - limit}
            </button>
          )}
          {!list.length && (
            <div className="empty">
              Ничего не нашлось.{' '}
              <a href={waLink('Здравствуйте! Пишу с сайта GLOWLY — ищу товар, которого нет в каталоге.')} target="_blank" rel="noreferrer">
                Напишите нам — привезём под заказ
              </a>
            </div>
          )}
        </div>
      </div>

      {recentItems.length > 1 && (
        <section className="recent">
          <div className="wrap sales-head">
            <h2>Вы смотрели</h2>
          </div>
          <div className="rail">
            {recentItems.map(p => (
              <button className="sale-card" key={p.id} onClick={() => setOpen(p)}>
                <img src={cover(p) ?? ''} alt="" loading="lazy" />
                <b>{p.brand}</b>
                <i>{split(p).title}</i>
                <u>{som(price(p))}</u>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="how" data-reveal>
        <div className="wrap">
          <h2 className="sec-title">Как заказать</h2>
          <div className="how-grid">
            <div><span>1</span><b>Выбираете товар</b><p>Жмёте «Заказать» — откроется WhatsApp с уже готовым сообщением.</p></div>
            <div><span>2</span><b>Мы подтверждаем</b><p>Проверяем наличие, называем срок доставки и итоговую сумму.</p></div>
            <div><span>3</span><b>Получаете и платите</b><p>Курьер по Бишкеку, оплата наличными или переводом при получении.</p></div>
          </div>
          <a className="add big wa-btn how-cta" href={waLink('Здравствуйте! Пишу с сайта GLOWLY — хочу заказать 🙂')}
            target="_blank" rel="noreferrer">
            Написать в WhatsApp
          </a>
        </div>
      </section>

      <section className="faq" data-reveal>
        <div className="wrap">
          <h2 className="sec-title">Частые вопросы</h2>
          <div className="faq-grid">
            <details><summary>Это оригинал?</summary><p>Да. Товар приходит со склада корейского поставщика, с корейскими штрихкодами и сроками годности на упаковке.</p></details>
            <details><summary>Сколько идёт доставка?</summary><p>По Бишкеку — обычно в день заказа или на следующий. В регионы отправляем транспортной компанией.</p></details>
            <details><summary>Можно посмотреть перед покупкой?</summary><p>Да, курьер привозит заказ, вы проверяете упаковку и срок годности, потом оплачиваете.</p></details>
            <details><summary>А если не подойдёт?</summary><p>Напишите нам в WhatsApp — поможем подобрать замену. Вскрытую косметику по закону вернуть нельзя, поэтому лучше сначала спросить совета.</p></details>
            <details><summary>Есть опт?</summary><p>Да, для салонов и магазинов условия отдельные. Напишите в WhatsApp, обсудим объём и цену.</p></details>
            <details><summary>Почему у вас дешевле?</summary><p>Возим напрямую со склада в Корее и не платим за аренду торговой точки в центре.</p></details>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <div>
            <div className="foot-logo">GLOW<span>LY</span></div>
            <p>GLOWLY — корейская косметика в Бишкеке. Цены в сомах, доставка по городу,
              оплата при получении. Наличие уточняйте в WhatsApp.</p>
          </div>
          <div className="foot-links">
            <a href={waLink('Здравствуйте!')} target="_blank" rel="noreferrer">WhatsApp {meta.contact}</a>
            <a href={waLink('Здравствуйте! Интересует опт.')} target="_blank" rel="noreferrer">Опт и салонам</a>
          </div>
        </div>
      </footer>

      {open && (
        <ProductModal
          p={open}
          onClose={() => setOpen(null)}
          onBrand={pickBrand}
          onOpen={setOpen}
          similar={all.filter(s => s.brand === open.brand && s.id !== open.id).slice(0, 6)}
          prev={list[list.findIndex(x => x.id === open.id) - 1] ?? null}
          next={list[list.findIndex(x => x.id === open.id) + 1] ?? null}
        />
      )}

      {favOpen && (
        <FavPanel items={favItems} wa={waLink}
          onOpen={p => { setFavOpen(false); setOpen(p) }}
          onRemove={fav.toggle} onClear={fav.clear} onClose={() => setFavOpen(false)} />
      )}

      {scrolled && (
        <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Наверх">↑</button>
      )}

      {brandOpen && (
        <BrandPicker
          brands={brands.slice(1)}
          counts={brandCounts}
          value={brand}
          onPick={b => { setBrand(b); setBrandOpen(false); }}
          onClose={() => setBrandOpen(false)}
        />
      )}

      <Toast />

      <a className="fab wa-fab" href={waLink('Здравствуйте! Пишу с сайта GLOWLY — есть вопрос 🙂')}
        target="_blank" rel="noreferrer">
        💬 Написать нам
      </a>

      <MobileBar favCount={fav.ids.length} onCatalog={toCatalog} onRoutine={toRoutine}
        onFav={() => setFavOpen(true)}
        wa={waLink('Здравствуйте! Пишу с сайта GLOWLY 🙂')} />
    </>
  )
}
