import { useEffect } from 'react'
import type { Product } from '../types'

type Props = {
  p: Product
  qty: number
  money: (usd: number) => string
  setQty: (n: number) => void
  onClose: () => void
}

export default function ProductModal({ p, qty, money, setQty, onClose }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose}>×</button>
        <div className="m-pic">
          {p.img ? <img src={`/img/${p.img}`} alt={p.name} /> : <div className="noimg">нет фото</div>}
        </div>
        <div className="m-body">
          <div className="brand">{p.brand}</div>
          <h2>{p.name}</h2>
          {p.spec && <div className="spec big">{p.spec}</div>}
          <div className="price big">{money(p.price)}<em>/{p.unit}</em></div>
          <table className="specs">
            <tbody>
              <tr><td>Упаковка</td><td>{p.pack ?? '—'}</td></tr>
              <tr><td>Штрихкод</td><td>{p.barcode ?? '—'}</td></tr>
              {p.exp && <tr><td>Годен до</td><td>{p.exp}</td></tr>}
              {p.sale && <tr><td>Акция</td><td>{p.sale}</td></tr>}
              {p.packQty && <tr><td>Короб</td><td>{p.packQty} шт · {money(p.price * p.packQty)}</td></tr>}
            </tbody>
          </table>
          <div className="m-actions">
            {qty > 0 ? (
              <div className="qty big">
                <button onClick={() => setQty(qty - 1)}>−</button>
                <input value={qty} onChange={e => setQty(Math.max(0, Number(e.target.value) || 0))} />
                <button onClick={() => setQty(qty + 1)}>+</button>
              </div>
            ) : (
              <button className="add big" onClick={() => setQty(p.packQty ?? 1)}>
                В заказ{p.packQty ? ` · короб ${p.packQty} шт` : ''}
              </button>
            )}
            {qty > 0 && <div className="sum">Сумма: {money(p.price * qty)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
