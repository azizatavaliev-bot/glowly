import type { Product } from '../types'
import { cover } from '../photo'
import { price, cityPrice, saving, som, inStock } from '../pricing'
import { split } from '../name'
import { orderLink } from './ProductModal'
import { useFavorites } from '../store'
import { toast } from './Toast'

type Props = {
  p: Product
  onOpen: () => void
}

export default function Card({ p, onOpen }: Props) {
  const pic = cover(p)
  const save = saving(p)
  const { title, sub } = split(p)
  const fav = useFavorites()
  const liked = fav.has(p.id)
  const stock = inStock(p)

  return (
    <article className="card">
      <div className="pic" onClick={onOpen}>
        {pic
          ? <img src={pic} alt={p.name} loading="lazy" />
          : <div className="noimg">нет фото</div>}
        <button className={liked ? 'heart on' : 'heart'} aria-label="В избранное"
          onClick={e => { e.stopPropagation(); fav.toggle(p.id); toast(liked ? 'Убрано из избранного' : '❤️ Добавлено в избранное') }}>
          {liked ? '♥' : '♡'}
        </button>
        <span className="peek">подробнее</span>
      </div>
      <div className="body">
        <div className="brand">{p.brand}</div>
        <h3 onClick={onOpen}>{title}</h3>
        {sub && <div className="sub" onClick={onOpen}>{sub}</div>}
        {p.spec && <div className="spec">{p.spec}</div>}
        <div className="row">
          <div className="price">
            {som(price(p))}
            {save > 0 && <s>{som(cityPrice(p))}</s>}
          </div>
        </div>
        <div className={stock ? 'stock in' : 'stock'}>{stock ? '● В наличии' : '○ Под заказ'}</div>
        <a className="add wa-btn" href={orderLink(p)} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}>
          {stock ? 'Заказать' : 'Заказать под заказ'}
        </a>
      </div>
    </article>
  )
}
