import type { Product } from '../types'
import { cover, photos } from '../photo'
import { price, cityPrice, saving, som } from '../pricing'
import { split } from '../name'
import { orderLink } from './ProductModal'
import videos from '../data/videos.json'
import { useFavorites } from '../store'
import { toast } from './Toast'

type Props = {
  p: Product
  delay: number
  onOpen: () => void
}

export default function Card({ p, delay, onOpen }: Props) {
  const pic = cover(p)
  const shots = photos(p).length
  const save = saving(p)
  const { title, sub } = split(p)
  const fav = useFavorites()
  const liked = fav.has(p.id)
  const hasVideo = !!(videos as Record<string, unknown>)[String(p.id)]
  const bigSave = save >= 150

  return (
    <article className="card" data-reveal style={{ transitionDelay: `${delay * 28}ms` }}>
      <div className="pic" onClick={onOpen}>
        {pic
          ? <img src={pic} alt={p.name} loading="lazy" />
          : <div className="noimg">нет фото</div>}
        {p.sale && <span className="badge">{p.sale.replace('АКЦИЯ ', '−').replace(/ [KS]$/, '')}</span>}
        {shots > 1 && <span className="shots">{shots} фото</span>}
        <div className="tags-tl">
          {bigSave && !p.sale && <span className="tag-mini">Выгодно</span>}
          {hasVideo && <span className="tag-mini video">▶ обзор</span>}
        </div>
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
        <a className="add wa-btn" href={orderLink(p)} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}>
          Заказать
        </a>
      </div>
    </article>
  )
}
