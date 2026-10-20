import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { cover } from '../photo'
import { price, som, optPrice, optTier, OPT_TIERS } from '../pricing'
import { split, full } from '../name'
import { useCart } from '../store'
import { waLink } from '../brand'
import { OPT, OPT_MIN } from '../mode'

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
  // в опте цена зависит от суммы: считаем по первой ступени, выбираем ступень и пересчитываем
  const base = rows.reduce((s, r) => s + price(r.p) * r.qty, 0)
  const tier = OPT ? optTier(base) : null
  const unit = (p: Product) => tier ? optPrice(p, tier.k) : price(p)
  const total = rows.reduce((s, r) => s + unit(r.p) * r.qty, 0)
  const next = tier ? OPT_TIERS.find(t => t.from > base) : undefined
  const lack = OPT ? Math.max(0, OPT_MIN - total) : 0

  const text = [
    `Здравствуйте! ${OPT ? 'Оптовый заказ' : 'Заказ'} № ${cart.order} с сайта lilo.asia`,
    '',
    ...rows.map((r, i) =>
      `${i + 1}. ${full(r.p)}${r.p.spec ? ` (${r.p.spec})` : ''} — ${r.p.brand}\n   ${r.qty} шт × ${som(unit(r.p))} = ${som(unit(r.p) * r.qty)}`),
    '',
    `Итого: ${som(total)} · ${cart.count} шт${tier ? ` (оптовая цена ${tier.label})` : ""}`,
    '',
    'Подтвердите, пожалуйста, наличие и когда сможете привезти.',
  ].join('\n')

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="cart" onClick={e => e.stopPropagation()}>
        <div className="cart-head">
          <h2>{OPT ? 'Оптовый заказ' : 'Корзина'} {cart.count > 0 && <small>{cart.count}</small>}</h2>
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
                <div className="ci-p">{p.brand} · {som(unit(p))}</div>
                <div className="ci-q">
                  <div className="stepper">
                    <button onClick={() => cart.set(p.id, qty - 1)} aria-label="Меньше">−</button>
                    <b>{qty}</b>
                    <button onClick={() => cart.set(p.id, qty + 1)} aria-label="Больше">+</button>
                  </div>
                  <b className="ci-sum">{som(unit(p) * qty)}</b>
                </div>
              </div>
              <button className="ci-x" onClick={() => cart.set(p.id, 0)} aria-label="Убрать">×</button>
            </div>
          ))}
        </div>

        {!!rows.length && (
          <div className="cart-foot">
            <div className="order-no">Заказ № <b>{cart.order}</b></div>
            {tier && (
              <div className="tier">
                Цена {tier.label}{tier.from > 0 && ` · экономия ${som(base - total)}`}
                {next && <span>Ещё {som(next.from - base)} — и цена {next.label} будет ниже</span>}
              </div>
            )}
            <div className="total">Итого: <b>{som(total)}</b> · {cart.count} шт</div>
            {lack > 0
              ? <div className="add big off-btn">До минимального заказа ещё {som(lack)}</div>
              : <a className="add big wa-btn" href={waLink(text)} target="_blank" rel="noreferrer" onClick={() => setSent(true)}>
                  Отправить заказ в WhatsApp
                </a>}
            {sent
              ? <div className="sent">Откроется WhatsApp с готовым сообщением — останется нажать «Отправить». Оплата при получении.</div>
              : <div className="sent mut">{OPT
                  ? `Оптовые цены действуют при заказе от ${som(OPT_MIN)}. Наличие и условия подтвердим в WhatsApp.`
                  : 'Оплата при получении. Наличие и время доставки подтвердим в WhatsApp.'}</div>}
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
