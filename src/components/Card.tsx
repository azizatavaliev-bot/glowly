import type { Product } from '../types'

type Props = {
  p: Product
  qty: number
  delay: number
  money: (usd: number) => string
  setQty: (n: number) => void
  onOpen: () => void
}

export default function Card({ p, qty, delay, money, setQty, onOpen }: Props) {
  return (
    <article className="card" data-reveal style={{ transitionDelay: `${delay * 28}ms` }}>
      <div className="pic" onClick={onOpen}>
        {p.img
          ? <img src={`/img/${p.img}`} alt={p.name} loading="lazy" />
          : <div className="noimg">нет фото</div>}
        {p.sale && <span className="badge">{p.sale.replace('АКЦИЯ ', '−').replace(/ [KS]$/, '')}</span>}
        <span className="peek">подробнее</span>
      </div>
      <div className="body">
        <div className="brand">{p.brand}</div>
        <h3 onClick={onOpen}>{p.name}</h3>
        {p.spec && <div className="spec">{p.spec}</div>}
        <div className="pack">{p.pack ?? '—'}{p.exp && ` · срок до ${p.exp}`}</div>
        <div className="row">
          <div className="price">{money(p.price)}<em>/{p.unit}</em></div>
          {qty > 0 ? (
            <div className="qty">
              <button onClick={() => setQty(qty - 1)}>−</button>
              <input value={qty} onChange={e => setQty(Math.max(0, Number(e.target.value) || 0))} />
              <button onClick={() => setQty(qty + 1)}>+</button>
            </div>
          ) : (
            <button className="add" onClick={() => setQty(p.packQty ?? 1)}>
              В заказ{p.packQty ? ` · ${p.packQty}` : ''}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
