import { useEffect, useState } from 'react'

/** Список id в localStorage, реактивный между компонентами через событие окна. */
function useIdList(key: string, max = 100): [number[], (id: number) => void, (id: number) => void, () => void] {
  const read = (): number[] => {
    try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
  }
  const [list, setList] = useState<number[]>(read)

  useEffect(() => {
    const sync = () => setList(read())
    window.addEventListener(`store:${key}`, sync)
    return () => window.removeEventListener(`store:${key}`, sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const write = (next: number[]) => {
    localStorage.setItem(key, JSON.stringify(next.slice(0, max)))
    window.dispatchEvent(new Event(`store:${key}`))
  }
  const toggle = (id: number) => {
    const cur = read()
    write(cur.includes(id) ? cur.filter(x => x !== id) : [id, ...cur])
  }
  const push = (id: number) => write([id, ...read().filter(x => x !== id)])
  const clear = () => write([])
  return [list, toggle, push, clear]
}

/** Избранное: сердечко на карточке, список для заказа одним сообщением. */
export function useFavorites() {
  const [ids, toggle, , clear] = useIdList('glowly.fav')
  return { ids, has: (id: number) => ids.includes(id), toggle, clear }
}

/** Недавно смотрели: последние 12 открытых карточек. */
export function useRecent() {
  const [ids, , push] = useIdList('glowly.recent', 12)
  return { ids, push }
}

/* ───────── корзина ───────── */

type CartState = { items: Record<number, number>; order: string | null }
const CART_KEY = 'lilo.cart'

function readCart(): CartState {
  try {
    const s = JSON.parse(localStorage.getItem(CART_KEY) || 'null')
    if (s && typeof s.items === 'object') return s
  } catch { /* битые данные — начинаем с пустой корзины */ }
  return { items: {}, order: null }
}

/**
 * Номер заказа: буква L, день и месяц, четыре случайные цифры — «L0810-4827».
 * Бэкенда нет, поэтому номер рождается на телефоне покупателя вместе с первой позицией в корзине
 * и живёт, пока корзину не очистят: по нему продавец и покупатель называют один и тот же заказ.
 */
function newOrderNo(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `L${pad(d.getDate())}${pad(d.getMonth() + 1)}-${Math.floor(1000 + Math.random() * 9000)}`
}

function writeCart(next: CartState) {
  const empty = !Object.keys(next.items).length
  localStorage.setItem(CART_KEY, JSON.stringify({ items: next.items, order: empty ? null : next.order ?? newOrderNo() }))
  window.dispatchEvent(new Event(`store:${CART_KEY}`))
}

/** Корзина: id товара → количество. Живёт в localStorage, общая для всех компонентов. */
export function useCart() {
  const [state, setState] = useState<CartState>(readCart)

  useEffect(() => {
    const sync = () => setState(readCart())
    window.addEventListener(`store:${CART_KEY}`, sync)
    return () => window.removeEventListener(`store:${CART_KEY}`, sync)
  }, [])

  const set = (id: number, qty: number) => {
    const cur = readCart()
    const items = { ...cur.items }
    if (qty <= 0) delete items[id]
    else items[id] = Math.min(qty, 99)
    writeCart({ ...cur, items })
  }
  return {
    items: state.items,
    order: state.order,
    count: Object.values(state.items).reduce((s, n) => s + n, 0),
    qty: (id: number) => state.items[id] ?? 0,
    add: (id: number, n = 1) => set(id, (readCart().items[id] ?? 0) + n),
    set,
    clear: () => writeCart({ items: {}, order: null }),
  }
}

/** Открыть панель корзины из любого места — карточки, модалки, подбора ухода. */
export const openCart = () => window.dispatchEvent(new Event('lilo:cart-open'))
