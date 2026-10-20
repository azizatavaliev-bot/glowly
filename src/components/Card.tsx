import type { Product } from '../types'
import { cover } from '../photo'
import { price, cityPrice, saving, som } from '../pricing'
import { split, expiry } from '../name'
import BuyButton from './BuyButton'
import { useFavorites } from '../store'
import { toast } from './Toast'

type Props = {
  p: Product
  onOpen: () => void
}

export default function Card({ p, onOpen }: Props) {
  const pic = cover(p)
  const save = saving(p)
  // скидка считается от «цены города» — той же, что зачёркнута рядом
  const off = Math.round(save / cityPrice(p) * 100)
  const { title, sub } = split(p)
  const fav = useFavorites()
  const liked = fav.has(p.id)

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
      </div>
      <div className="body">
        <div className="price">
          {som(price(p))}
          {save > 0 && <s>{som(cityPrice(p))}</s>}
          {off >= 5 && <em className="off">−{off}%</em>}
        </div>
        <h3 onClick={onOpen}><b>{p.brand}</b> {title}</h3>
        <div className="sub" onClick={onOpen}>{[sub, p.spec].filter(Boolean).join(' · ')}</div>
        {expiry(p) && <div className="exp">годен {expiry(p)}</div>}
        <BuyButton p={p} />
      </div>
    </article>
  )
}
