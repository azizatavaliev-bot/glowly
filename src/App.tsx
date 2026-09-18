import { useEffect, useMemo, useState } from 'react'
import data from './data/products.json'
import type { Product, Meta } from './types'
import Card from './components/Card'
import ProductModal from './components/ProductModal'
import CartPanel from './components/CartPanel'

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
  const [limit, setLimit] = useState(60)
  const [open, setOpen] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}') } catch { return {} }
  })

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem(RATE_KEY, String(rate)) }, [rate])

  const cats = useMemo(() => ['Все', ...Array.from(new Set(all.map(p => p.cat)))
    .sort((a, b) => all.filter(p => p.cat === b).length - all.filter(p => p.cat === a).length)], [])
  const brands = useMemo(() => ['Все', ...Array.from(new Set(all.map(p => p.brand))).sort()], [])

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    let r = all.filter(p => {
      if (cat !== 'Все' && p.cat !== cat) return false
      if (brand !== 'Все' && p.brand !== brand) return false
      if (onlySale && !p.sale) return false
      if (!words.length) return true
      const hay = `${p.full} ${p.spec ?? ''} ${p.barcode ?? ''}`.toLowerCase()
      return words.every(w => hay.includes(w))
    })
    r = [...r].sort((a, b) =>
      sort === 'price-asc' ? a.price - b.price :
      sort === 'price-desc' ? b.price - a.price :
      a.name.localeCompare(b.name, 'ru'))
    return r
  }, [q, cat, brand, sort, onlySale])

  useEffect(() => { setLimit(60) }, [q, cat, brand, sort, onlySale])

  const money = (usd: number) =>
    kgs ? `${Math.round(usd * rate).toLocaleString('ru-RU')} с` : `$${usd.toFixed(2)}`

  const setQty = (id: number, n: number) =>
    setCart(c => {
      const next = { ...c }
      if (n <= 0) delete next[id]; else next[id] = n
      return next
    })

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ p: all.find(x => x.id === Number(id))!, qty }))
    .filter(x => x.p)
  const total = cartItems.reduce((s, x) => s + x.p.price * x.qty, 0)
  const count = cartItems.reduce((s, x) => s + x.qty, 0)

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <div className="logo">
            KOR<span>SHOP</span>
            <em>оптовый каталог · Корея</em>
          </div>
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

      <div className="hero">
        <div className="wrap">
          <h1>Корейская косметика оптом</h1>
          <p>{all.length} позиций · {brands.length - 1} брендов · прайс от {meta.date}. Цены в USD за штуку, отгрузка коробами.</p>
        </div>
      </div>

      <div className="wrap">
        <div className="tools">
          <input className="search" placeholder="Поиск: название, бренд, штрихкод…"
            value={q} onChange={e => setQ(e.target.value)} />
          <select value={brand} onChange={e => setBrand(e.target.value)}>
            {brands.map(b => <option key={b}>{b}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}>
            <option value="name">По названию</option>
            <option value="price-asc">Сначала дешёвые</option>
            <option value="price-desc">Сначала дорогие</option>
          </select>
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

        <div className="found">Найдено: {list.length}</div>

        <div className="grid">
          {list.slice(0, limit).map(p => (
            <Card key={p.id} p={p} money={money} qty={cart[p.id] || 0}
              setQty={n => setQty(p.id, n)} onOpen={() => setOpen(p)} />
          ))}
        </div>

        {list.length > limit && (
          <button className="more" onClick={() => setLimit(l => l + 60)}>
            Показать ещё ({list.length - limit})
          </button>
        )}
        {!list.length && <div className="empty">Ничего не нашлось. Попробуй другой запрос.</div>}
      </div>

      <footer>
        <div className="wrap">
          <b>KORSHOP</b> · {meta.site} · WA/TG {meta.contact}<br />
          Прайс от {meta.date}. Цены оптовые, в USD. Наличие уточняйте перед заказом.
        </div>
      </footer>

      {open && <ProductModal p={open} money={money} qty={cart[open.id] || 0}
        setQty={n => setQty(open.id, n)} onClose={() => setOpen(null)} />}

      {cartOpen && <CartPanel items={cartItems} total={total} money={money} wa={WA}
        setQty={setQty} onClose={() => setCartOpen(false)} clear={() => setCart({})} />}

      {count > 0 && !cartOpen && (
        <button className="fab" onClick={() => setCartOpen(true)}>
          Заказ: {count} поз. · {money(total)}
        </button>
      )}
    </>
  )
}
