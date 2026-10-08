import type { Product } from '../types'
import { useCart } from '../store'
import { toast } from './Toast'

/** Кнопка «В корзину»; когда товар уже в корзине — счётчик «− 2 +» на том же месте. */
export default function BuyButton({ p, big = false }: { p: Product; big?: boolean }) {
  const cart = useCart()
  const qty = cart.qty(p.id)
  const stop = (e: React.MouseEvent) => e.stopPropagation()

  if (!qty) return (
    <button className={big ? 'add big' : 'add buy'} onClick={e => { stop(e); cart.add(p.id); toast('🛒 Добавлено в корзину') }}>
      В корзину
    </button>
  )
  return (
    <div className={big ? 'stepper wide big' : 'stepper wide'} onClick={stop}>
      <button onClick={() => cart.set(p.id, qty - 1)} aria-label="Меньше">−</button>
      <b>{qty} в корзине</b>
      <button onClick={() => cart.set(p.id, qty + 1)} aria-label="Больше">+</button>
    </div>
  )
}
