import { useEffect } from 'react'
import type { Product } from '../types'
import { cover } from '../photo'
import { price, som } from '../pricing'
import { split, full } from '../name'

type Props = {
  items: Product[]
  onOpen: (p: Product) => void
  onRemove: (id: number) => void
  onClear: () => void
  onClose: () => void
  wa: (text: string) => string
}

export default function FavPanel({ items, onOpen, onRemove, onClear, onClose, wa }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const total = items.reduce((s, p) => s + price(p), 0)
  const text = `Здравствуйте! Пишу с сайта GLOWLY, хочу заказать:\n\n${items
    .map((p, i) => `${i + 1}. ${full(p)}${p.spec ? ` (${p.spec})` : ''} — ${som(price(p))}`)
    .join('\n')}\n\nИтого: ${som(total)}. Всё есть в наличии?`

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="cart" onClick={e => e.stopPropagation()}>
        <div className="cart-head">
          <h2>Избранное {items.length > 0 && <small>{items.length}</small>}</h2>
          <button className="x" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {!items.length && (
          <div className="empty">
            Пока пусто. Жмите ❤️ на товарах — соберёте список и отправите его одним сообщением.
          </div>
        )}

        <div className="cart-list">
          {items.map(p => (
            <div className="ci" key={p.id}>
              {cover(p) ? <img src={cover(p)!} alt="" onClick={() => onOpen(p)} /> : <div className="noimg sm" />}
              <div className="ci-b" onClick={() => onOpen(p)}>
                <div className="ci-n">{split(p).title}{p.spec ? ` · ${p.spec}` : ''}</div>
                <div className="ci-p"><b>{som(price(p))}</b> · {p.brand}</div>
              </div>
              <button className="ci-x" onClick={() => onRemove(p.id)} aria-label="Убрать">×</button>
            </div>
          ))}
        </div>

        {!!items.length && (
          <div className="cart-foot">
            <div className="total">Итого: <b>{som(total)}</b> · {items.length} поз.</div>
            <a className="add big wa-btn" href={wa(text)} target="_blank" rel="noreferrer">
              Заказать всё в WhatsApp
            </a>
            <div className="mini">
              <button className="danger" onClick={onClear}>Очистить список</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
