import type { Product } from '../types'
import { cover } from '../photo'

type Item = { p: Product; qty: number }
type Props = {
  items: Item[]
  total: number
  wa: string
  money: (usd: number) => string
  setQty: (id: number, n: number) => void
  onClose: () => void
  clear: () => void
}

export default function CartPanel({ items, total, wa, money, setQty, onClose, clear }: Props) {
  const text = () => {
    const lines = items.map(({ p, qty }) =>
      `• ${p.full}${p.spec ? ` [${p.spec}]` : ''} — ${qty} ${p.unit} × $${p.price.toFixed(2)} = $${(p.price * qty).toFixed(2)}`)
    return `Заявка KORSHOP\n${lines.join('\n')}\n\nИтого: $${total.toFixed(2)} (${items.length} поз.)`
  }

  const send = () => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text())}`, '_blank')
  const copy = () => navigator.clipboard.writeText(text())
  const csv = () => {
    const rows = [['Номенклатура', 'Характеристика', 'Штрихкод', 'Цена USD', 'Кол-во', 'Сумма USD'],
      ...items.map(({ p, qty }) => [p.full, p.spec ?? '', p.barcode ?? '', p.price, qty, (p.price * qty).toFixed(2)])]
    const csvText = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csvText], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'korshop-zayavka.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="cart" onClick={e => e.stopPropagation()}>
        <div className="cart-head">
          <h2>Заявка</h2>
          <button className="x" onClick={onClose}>×</button>
        </div>

        {!items.length && <div className="empty">Пока пусто. Добавь товары из каталога.</div>}

        <div className="cart-list">
          {items.map(({ p, qty }) => (
            <div className="ci" key={p.id}>
              {cover(p) ? <img src={cover(p)!} alt="" /> : <div className="noimg sm" />}
              <div className="ci-b">
                <div className="ci-n">{p.name}{p.spec ? ` · ${p.spec}` : ''}</div>
                <div className="ci-p">{money(p.price)} × {qty} = <b>{money(p.price * qty)}</b></div>
              </div>
              <div className="qty sm">
                <button onClick={() => setQty(p.id, qty - 1)}>−</button>
                <input value={qty} onChange={e => setQty(p.id, Math.max(0, Number(e.target.value) || 0))} />
                <button onClick={() => setQty(p.id, qty + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        {!!items.length && (
          <div className="cart-foot">
            <div className="total">Итого: <b>{money(total)}</b> · {items.length} поз.</div>
            <button className="add big" onClick={send}>Отправить в WhatsApp</button>
            <div className="mini">
              <button onClick={copy}>Копировать текст</button>
              <button onClick={csv}>Скачать CSV</button>
              <button className="danger" onClick={clear}>Очистить</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
