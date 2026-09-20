import type { Product } from '../types'
import { cover, photos } from '../photo'
import { price, cityPrice, saving, som } from '../pricing'
import { orderLink } from './ProductModal'

type Props = {
  p: Product
  delay: number
  onOpen: () => void
}

export default function Card({ p, delay, onOpen }: Props) {
  const pic = cover(p)
  const shots = photos(p).length
  const save = saving(p)

  return (
    <article className="card" data-reveal style={{ transitionDelay: `${delay * 28}ms` }}>
      <div className="pic" onClick={onOpen}>
        {pic
          ? <img src={pic} alt={p.name} loading="lazy" />
          : <div className="noimg">нет фото</div>}
        {p.sale && <span className="badge">{p.sale.replace('АКЦИЯ ', '−').replace(/ [KS]$/, '')}</span>}
        {shots > 1 && <span className="shots">{shots} фото</span>}
        <span className="peek">подробнее</span>
      </div>
      <div className="body">
        <div className="brand">{p.brand}</div>
        <h3 onClick={onOpen}>{p.name}</h3>
        {p.spec && <div className="spec">{p.spec}</div>}
        <div className="row">
          <div className="price">
            {som(price(p))}
            {save > 0 && <s>{som(cityPrice(p))}</s>}
          </div>
        </div>
        <a className="add wa-btn" href={orderLink(p)} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}>
          Заказать
        </a>
      </div>
    </article>
  )
}
