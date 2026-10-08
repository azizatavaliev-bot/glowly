import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { cover } from '../photo'
import { price, som } from '../pricing'
import { split, full } from '../name'
import { useCart } from '../store'
import { waLink } from '../brand'

type Props = {
  all: Product[]
  onOpen: (p: Product) => void
  onClose: () => void
}

/** Корзина: набрали товары — заказ уходит в WhatsApp одним готовым сообщением с номером. */
export default function CartPanel({ all, onOpen, onClose }: Props) {
  const cart = useCart()
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const rows = Object.entries(cart.items)
    .map(([id, qty]) => ({ p: all.find(x => x.id === Number(id)), qty }))
    .filter((r): r is { p: Product; qty: number } => !!r.p)
  const total = rows.reduce((s, r) => s + price(r.p) * r.qty, 0)

  const text = [
    `Здравствуйте! Заказ № ${cart.order} с сайта lilo.asia`,
    '',
    ...rows.map((r, i) =>
      `${i + 1}. ${full(r.p)}${r.p.spec ? ` (${r.p.spec})` : ''} — ${r.p.brand}\n   ${r.qty} шт × ${som(price(r.p))} = ${som(price(r.p) * r.qty)}`),
    '',
    `Итого: ${som(total)} · ${cart.count} шт`,
    '',
    'Подтвердите, пожалуйста, наличие и когда сможете привезти.',
  ].join('\n')

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="cart" onClick={e => e.stopPropagation()}>
        <div className="cart-head">
          <h2>Корзина {cart.count > 0 && <small>{cart.count}</small>}</h2>
          <button className="x" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        {!rows.length && (
          <div className="empty">
            В корзине пусто. Нажмите «В корзину» на товаре — соберём заказ и отправим его в WhatsApp одним сообщением.
          </div>
        )}

        <div className="cart-list">
          {rows.map(({ p, qty }) => (
            <div className="ci" key={p.id}>
              {cover(p) ? <img src={cover(p)!} alt="" onClick={() => onOpen(p)} /> : <div className="noimg sm" />}
              <div className="ci-b">
                <div className="ci-n" onClick={() => onOpen(p)}>{split(p).title}{p.spec ? ` · ${p.spec}` : ''}</div>
                <div className="ci-p">{p.brand} · {som(price(p))}</div>
                <div className="ci-q">
                  <div className="stepper">
                    <button onClick={() => cart.set(p.id, qty - 1)} aria-label="Меньше">−</button>
                    <b>{qty}</b>
                    <button onClick={() => cart.set(p.id, qty + 1)} aria-label="Больше">+</button>
                  </div>
                  <b className="ci-sum">{som(price(p) * qty)}</b>
                </div>
              </div>
              <button className="ci-x" onClick={() => cart.set(p.id, 0)} aria-label="Убрать">×</button>
            </div>
          ))}
        </div>

        {!!rows.length && (
          <div className="cart-foot">
            <div className="order-no">Заказ № <b>{cart.order}</b></div>
            <div className="total">Итого: <b>{som(total)}</b> · {cart.count} шт</div>
            <a className="add big wa-btn" href={waLink(text)} target="_blank" rel="noreferrer" onClick={() => setSent(true)}>
              Отправить заказ в WhatsApp
            </a>
            {sent
              ? <div className="sent">Откроется WhatsApp с готовым сообщением — останется нажать «Отправить». Оплата при получении.</div>
              : <div className="sent mut">Оплата при получении. Наличие и время доставки подтвердим в WhatsApp.</div>}
            <div className="mini">
              <button className="danger" onClick={() => { cart.clear(); setSent(false) }}>
                {sent ? 'Очистить и начать новый заказ' : 'Очистить корзину'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
