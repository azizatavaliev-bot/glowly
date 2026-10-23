import type { Product } from '../types'
import { cover } from '../photo'
import { price, retail, som, usd, optUsd } from '../pricing'
import { OPT } from '../mode'
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
        {/* на опте — обе цены с подписями, без зачёркиваний и процентов */}
        {OPT
          ? <div className="price two"><span><i>опт</i>{som(price(p))}<b className="usd">{usd(optUsd(p))}</b></span><span className="rt"><i>розница</i>{som(retail(p))}</span></div>
          : <div className="price">{som(price(p))}</div>}
        <h3 onClick={onOpen}><b>{p.brand}</b> {title}</h3>
        <div className="sub" onClick={onOpen}>{[sub, p.spec].filter(Boolean).join(' · ')}</div>
        {expiry(p) && <div className="exp">годен {expiry(p)}</div>}
        <BuyButton p={p} />
      </div>
    </article>
  )
}
