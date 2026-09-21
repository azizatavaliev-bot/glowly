import { useEffect, useState } from 'react'
import type { Product, Video } from '../types'
import { summary, volume, benefits, forWhom, steps } from '../describe'
import { photos } from '../photo'
import { price, cityPrice, saving, som } from '../pricing'
import { split, full } from '../name'
import videos from '../data/videos.json'
import { useFavorites, useRecent } from '../store'

type Props = {
  p: Product
  onClose: () => void
  onBrand: (b: string) => void
  similar: Product[]
  onOpen: (p: Product) => void
  prev: Product | null
  next: Product | null
}

const WA = '996559050618'

export function orderLink(p: Product): string {
  const text = `Здравствуйте! Пишу с сайта GLOWLY, хочу заказать:\n${full(p)}${p.spec ? ` (${p.spec})` : ''}\n${p.brand} · ${som(price(p))}\n\nПодскажите, есть в наличии?`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

export default function ProductModal({ p, onClose, onBrand, similar, onOpen, prev, next }: Props) {
  const [shot, setShot] = useState(0)
  const v = volume(p)
  const shots = photos(p)
  const good = benefits(p)
  const who = forWhom(p)
  const how = steps(p)
  const clip = (videos as Record<string, Video[]>)[String(p.id)]?.[0]
  const save = saving(p)
  const fav = useFavorites()
  const recent = useRecent()
  const liked = fav.has(p.id)

  useEffect(() => { setShot(0); recent.push(p.id) }, [p.id])  // eslint-disable-line react-hooks/exhaustive-deps

  // на телефоне — системное «Поделиться», на компьютере — копируем ссылку
  const share = async () => {
    const url = `${location.origin}${location.pathname}?p=${p.id}`
    const data = { title: `${split(p).title} — GLOWLY`, text: `${full(p)} · ${som(price(p))}`, url }
    if (navigator.share) { try { await navigator.share(data) } catch { /* отменили */ } }
    else { await navigator.clipboard.writeText(url); alert('Ссылка скопирована') }
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && prev) onOpen(prev)
      if (e.key === 'ArrowRight' && next) onOpen(next)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose, onOpen, prev, next])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Закрыть">×</button>
        <div className="nav">
          <button disabled={!prev} onClick={() => prev && onOpen(prev)} aria-label="Предыдущий товар">‹</button>
          <button disabled={!next} onClick={() => next && onOpen(next)} aria-label="Следующий товар">›</button>
        </div>

        <div className="m-left">
          <div className="m-pic">
            {shots.length
              ? <img src={shots[shot]} alt={p.name} key={shots[shot]} />
              : <div className="noimg">нет фото</div>}
            {p.sale && <span className="badge">{p.sale.replace('АКЦИЯ ', '−').replace(/ [KS]$/, '')}</span>}
          </div>
          {shots.length > 1 && (
            <div className="thumbs">
              {shots.map((src, i) => (
                <button key={src} className={i === shot ? 'on' : ''} onClick={() => setShot(i)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="m-facts">
            {v.text !== '—' && <div><span>Объём</span><b>{v.text}</b></div>}
            <div><span>Страна</span><b>Корея 🇰🇷</b></div>
            {p.exp && <div><span>Годен до</span><b>{p.exp}</b></div>}
            <div><span>Категория</span><b>{p.cat}</b></div>
          </div>
        </div>

        <div className="m-body">
          <button className="brand link-brand" onClick={() => { onBrand(p.brand); onClose() }}>
            {p.brand} →
          </button>
          <h2>{split(p).title}</h2>
          {split(p).sub && <div className="sub big">{split(p).sub}</div>}
          {p.spec && <div className="spec big">{p.spec}</div>}

          <div className="m-price">
            <div className="price big">{som(price(p))}</div>
            {save > 0 && (
              <div className="save">
                <s>{som(cityPrice(p))}</s>
                <span>выгода {som(save)}</span>
              </div>
            )}
          </div>

          <div className="m-cta">
            <a className="add big wa-btn" href={orderLink(p)} target="_blank" rel="noreferrer">
              Заказать в WhatsApp
            </a>
            <button className={liked ? 'heart-big on' : 'heart-big'} onClick={() => fav.toggle(p.id)}
              aria-label="В избранное" title={liked ? 'Убрать из избранного' : 'В избранное'}>
              {liked ? '♥' : '♡'}
            </button>
            <button className="share-big" onClick={share} aria-label="Поделиться" title="Поделиться">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
              </svg>
            </button>
          </div>
          <div className="pay-note">Ответим в течение дня · доставка по Бишкеку · оплата при получении</div>

          <p className="what">{summary(p)}</p>

          <section className="sec">
            <div className="sec-h">Чем полезен</div>
            <ul className="dots plain">
              {good.map(b => <li key={b}>{b}</li>)}
            </ul>
          </section>

          <section className="sec">
            <div className="sec-h">Кому подойдёт</div>
            <div className="chips">
              {who.map(w => <span className="chip-sm" key={w}>{w}</span>)}
            </div>
          </section>

          <section className="sec">
            <div className="sec-h">Как применять</div>
            <ol className="steps">
              {how.map(st => <li key={st}>{st}</li>)}
            </ol>
          </section>

          {clip && (
            <section className="sec">
              <div className="sec-h">Видеообзор</div>
              <a className="clip" href={`https://www.youtube.com/watch?v=${clip.v}`} target="_blank" rel="noreferrer">
                <img src={`https://i.ytimg.com/vi/${clip.v}/hqdefault.jpg`} alt="" loading="lazy" />
                <div className="clip-b">
                  <b>{clip.title}</b>
                  <span>{clip.ch}{clip.len ? ` · ${clip.len}` : ''}</span>
                </div>
                <span className="play">▶</span>
              </a>
            </section>
          )}

          {!!similar.length && (
            <div className="similar">
              <div className="similar-head">Ещё у {p.brand}</div>
              <div className="similar-row">
                {similar.map(s => (
                  <button key={s.id} onClick={() => onOpen(s)}>
                    {photos(s)[0] && <img src={photos(s)[0]} alt="" />}
                    <i>{split(s).title}</i>
                    <u>{som(price(s))}</u>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
