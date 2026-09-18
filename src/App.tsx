import { useEffect, useMemo, useRef, useState } from 'react'
import data from './data/products.json'
import type { Product, Meta } from './types'
import Card from './components/Card'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import ProductModal from './components/ProductModal'
import BrandPicker from './components/BrandPicker'
import Dropdown from './components/Dropdown'
import CartPanel from './components/CartPanel'
import { useReveal } from './useReveal'
import { cover } from './photo'

const meta = data.meta as Meta
const all = data.products as Product[]

const WA = '996559050618'
const RATE_KEY = 'korshop.rate'
const CART_KEY = 'korshop.cart'

type Sort = 'name' | 'price-asc' | 'price-desc'

export default function App() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Все')
  const [brand, setBrand] = useState('Все')
  const [sort, setSort] = useState<Sort>('name')
  const [onlySale, setOnlySale] = useState(false)
  const [kgs, setKgs] = useState(false)
  const [rate, setRate] = useState(() => Number(localStorage.getItem(RATE_KEY)) || 87.5)
  const [limit, setLimit] = useState(48)
  const [open, setOpen] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [brandOpen, setBrandOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const catalogRef = useRef<HTMLDivElement>(null)
  const [cart, setCart] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(RATE_KEY, String(rate)) }, [rate])
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

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    document.body.classList.toggle('locked', !!open || cartOpen || brandOpen)
  }, [open, cartOpen, brandOpen])

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
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const r = all.filter(p => {
      if (cat !== 'Все' && p.cat !== cat) return false
      if (brand !== 'Все' && p.brand !== brand) return false
      if (onlySale && !p.sale) return false
      if (!words.length) return true
      const hay = `${p.full} ${p.spec ?? ''} ${p.barcode ?? ''}`.toLowerCase()
      return words.every(w => hay.includes(w))
    })
    return [...r].sort((a, b) =>
      sort === 'price-asc' ? a.price - b.price :
      sort === 'price-desc' ? b.price - a.price :
      a.name.localeCompare(b.name, 'ru'))
  }, [q, cat, brand, sort, onlySale])

  useEffect(() => { setLimit(48) }, [q, cat, brand, sort, onlySale])
  useReveal([list, limit])

  const money = (usd: number) =>
    kgs ? `${Math.round(usd * rate).toLocaleString('ru-RU')} с` : `$${usd.toFixed(2)}`

  const setQty = (id: number, n: number) =>
    setCart(c => {
      const next = { ...c }
      if (n <= 0) delete next[id]; else next[id] = n
      return next
    })

  const toCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const pickBrand = (b: string) => { setBrand(b); setCat('Все'); toCatalog() }

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ p: all.find(x => x.id === Number(id))!, qty }))
    .filter(x => x.p)
  const total = cartItems.reduce((s, x) => s + x.p.price * x.qty, 0)
  const count = cartItems.reduce((s, x) => s + x.qty, 0)

  return (
    <>
      <header className={scrolled ? 'top solid' : 'top'}>
        <div className="wrap top-in">
          <button className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            KOR<span>SHOP</span>
          </button>
          <div className="top-right">
            <div className="cur">
              <button className={!kgs ? 'on' : ''} onClick={() => setKgs(false)}>USD</button>
              <button className={kgs ? 'on' : ''} onClick={() => setKgs(true)}>сом</button>
              {kgs && (
                <input className="rate" type="number" value={rate} step="0.5"
                  onChange={e => setRate(Number(e.target.value) || 0)} title="курс USD→KGS" />
              )}
            </div>
            <a className="wa" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">WhatsApp</a>
            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              Заказ{count > 0 && <b>{count}</b>}
            </button>
          </div>
        </div>
      </header>

      <Hero total={all.length} brands={brands.length - 1} date={meta.date}
        columns={columns} onStart={toCatalog} />

      <Marquee items={brands.slice(1)} onPick={pickBrand} />

      {!!sales.length && (
        <section className="sales" data-reveal>
          <div className="wrap sales-head">
            <h2>Акции склада</h2>
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
                <i>{p.name}</i>
                <u>{money(p.price)}</u>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="catalog" ref={catalogRef} id="catalog">
        <div className="wrap">
          <h2 className="sec-title" data-reveal>Каталог</h2>
        </div>

        <div className="sticky">
          <div className="wrap">
            <div className="tools">
              <input className="search" placeholder="Поиск: название, бренд, штрихкод…"
                value={q} onChange={e => setQ(e.target.value)} />
              <button className={brand === 'Все' ? 'dd-btn wide' : 'dd-btn wide on'}
                onClick={() => setBrandOpen(true)}>
                {brand === 'Все' ? 'Все бренды' : brand}<span className="dd-arrow" />
              </button>
              <Dropdown value={sort} onChange={v => setSort(v as Sort)} options={[
                { value: 'name', label: 'По названию' },
                { value: 'price-asc', label: 'Сначала дешёвые' },
                { value: 'price-desc', label: 'Сначала дорогие' },
              ]} />
              <label className="chk">
                <input type="checkbox" checked={onlySale} onChange={e => setOnlySale(e.target.checked)} />
                Только акции
              </label>
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
            {(brand !== 'Все' || cat !== 'Все' || onlySale || q) && (
              <button className="link" onClick={() => { setBrand('Все'); setCat('Все'); setOnlySale(false); setQ('') }}>
                сбросить фильтры
              </button>
            )}
          </div>

          <div className="grid">
            {list.slice(0, limit).map((p, i) => (
              <Card key={p.id} p={p} money={money} qty={cart[p.id] || 0} delay={i % 12}
                setQty={n => setQty(p.id, n)} onOpen={() => setOpen(p)} />
            ))}
          </div>

          {list.length > limit && (
            <button className="more" onClick={() => setLimit(l => l + 48)}>
              Показать ещё <b>{Math.min(48, list.length - limit)}</b> из {list.length - limit}
            </button>
          )}
          {!list.length && <div className="empty">Ничего не нашлось. Попробуй другой запрос.</div>}
        </div>
      </div>

      <footer>
        <div className="wrap foot-in">
          <div>
            <div className="foot-logo">KOR<span>SHOP</span></div>
            <p>Корейская косметика оптом. Прайс от {meta.date}, цены в USD за штуку.
              Наличие уточняйте перед заказом.</p>
          </div>
          <div className="foot-links">
            <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">WhatsApp {meta.contact}</a>
            <a href={`https://${meta.site}`} target="_blank" rel="noreferrer">{meta.site}</a>
          </div>
        </div>
      </footer>

      {open && (
        <ProductModal
          p={open}
          money={money}
          kgs={kgs}
          rate={rate}
          qty={cart[open.id] || 0}
          setQty={n => setQty(open.id, n)}
          onClose={() => setOpen(null)}
          onBrand={pickBrand}
          onOpen={setOpen}
          similar={all.filter(s => s.brand === open.brand && s.id !== open.id).slice(0, 6)}
          prev={list[list.findIndex(x => x.id === open.id) - 1] ?? null}
          next={list[list.findIndex(x => x.id === open.id) + 1] ?? null}
        />
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

      {cartOpen && <CartPanel items={cartItems} total={total} money={money} wa={WA}
        setQty={setQty} onClose={() => setCartOpen(false)} clear={() => setCart({})} />}

      {count > 0 && !cartOpen && !open && (
        <button className="fab" onClick={() => setCartOpen(true)}>
          <b>{count}</b> поз. · {money(total)} <span>оформить →</span>
        </button>
      )}
    </>
  )
}
