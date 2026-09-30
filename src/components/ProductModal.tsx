import { useEffect, useRef, useState } from 'react'
import type { Product, Video } from '../types'
import { summary, volume, benefits, forWhom, steps } from '../describe'
import { photos } from '../photo'
import { price, cityPrice, saving, som, inStock, ORDER_DAYS } from '../pricing'
import { split, full } from '../name'
import videos from '../data/videos.json'
import details from '../data/details.json'
import { useFavorites, useRecent } from '../store'
import { toast } from './Toast'

type Props = {
  p: Product
  onClose: () => void
  onBrand: (b: string) => void
  similar: Product[]
  onOpen: (p: Product) => void
  prev: Product | null
  next: Product | null
}

type Detail = {
  about: string
  benefits: string[]
  for: string[]
  howto: string[]
  actives: { label: string; text: string }[]
  tip?: string
  result?: string[][]
  combo?: string[]
  faq?: string[][]
}

const WA = '996559050618'

export function orderLink(p: Product): string {
  const tail = inStock(p) ? 'Когда сможете привезти?' : 'Вижу, что под заказ — сколько ждать?'
  const text = `Здравствуйте! Пишу с сайта GLOWLY, хочу заказать:\n${full(p)}${p.spec ? ` (${p.spec})` : ''}\n${p.brand} · ${som(price(p))}\n\n${tail}`
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
}

export default function ProductModal({ p, onClose, onBrand, similar, onOpen, prev, next }: Props) {
  const [shot, setShot] = useState(0)
  const [zoom, setZoom] = useState(false)
  const gallery = useRef<HTMLDivElement>(null)
  const v = volume(p)
  const shots = photos(p)
  const d = (details as unknown as Record<string, Detail>)[String(p.id)]
  const good = d?.benefits ?? benefits(p)
  const who = d?.for ?? forWhom(p)
  const how = d?.howto ?? steps(p)
  const clip = (videos as Record<string, Video[]>)[String(p.id)]?.[0]
  const save = saving(p)
  const fav = useFavorites()
  const recent = useRecent()
  const liked = fav.has(p.id)

  useEffect(() => { setShot(0); recent.push(p.id); gallery.current?.scrollTo({ left: 0 }) }, [p.id])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') zoom ? setZoom(false) : onClose()
      if (e.key === 'ArrowLeft' && prev) onOpen(prev)
      if (e.key === 'ArrowRight' && next) onOpen(next)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose, onOpen, prev, next, zoom])

  // на телефоне галерея листается пальцем — следим, какое фото в центре
  const onScroll = () => {
    const el = gallery.current
    if (!el) return
    setShot(Math.round(el.scrollLeft / el.clientWidth))
  }

  const share = async () => {
    const url = `${location.origin}${location.pathname}?p=${p.id}`
    const data = { title: `${split(p).title} — GLOWLY`, text: `${full(p)} · ${som(price(p))}`, url }
    if (navigator.share) { try { await navigator.share(data) } catch { /* отменили */ } }
    else { await navigator.clipboard.writeText(url); toast('Ссылка скопирована') }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Закрыть">×</button>
        <div className="nav">
          <button disabled={!prev} onClick={() => prev && onOpen(prev)} aria-label="Предыдущий товар">‹</button>
          <button disabled={!next} onClick={() => next && onOpen(next)} aria-label="Следующий товар">›</button>
        </div>

        <div className="m-left">
          {/* десктоп: одно фото + миниатюры; телефон: лента со свайпом */}
          <div className="m-pic zoomable" onClick={() => shots.length && setZoom(true)}>
            {shots.length
              ? <img src={shots[shot]} alt={p.name} key={shots[shot]} />
              : <div className="noimg">нет фото</div>}
            <span className="zoom-hint">нажмите, чтобы увеличить</span>
          </div>

          <div className="m-swipe" ref={gallery} onScroll={onScroll}>
            {shots.map(src => (
              <div className="m-slide" key={src} onClick={() => setZoom(true)}>
                <img src={src} alt={p.name} />
              </div>
            ))}
          </div>
          {shots.length > 1 && (
            <div className="dots-nav">
              {shots.map((s, i) => <i key={s} className={i === shot ? 'on' : ''} />)}
            </div>
          )}

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
            <div><span>Бренд</span><b>{p.brand}</b></div>
            <div><span>Страна</span><b>Корея 🇰🇷</b></div>
            {p.exp && <div><span>Годен до</span><b>{p.exp}</b></div>}
            <div><span>Категория</span><b>{p.cat}</b></div>
          </div>
        </div>

        {zoom && (
          <div className="lightbox" onClick={e => { e.stopPropagation(); setZoom(false) }}>
            <img src={shots[shot]} alt={p.name} />
            <button className="x" aria-label="Закрыть">×</button>
          </div>
        )}

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
            <button className={liked ? 'heart-big on' : 'heart-big'}
              onClick={() => { fav.toggle(p.id); toast(liked ? 'Убрано из избранного' : '❤️ Добавлено в избранное') }}
              aria-label="В избранное">{liked ? '♥' : '♡'}</button>
            <button className="share-big" onClick={share} aria-label="Поделиться">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" />
              </svg>
            </button>
          </div>

          {inStock(p)
            ? <div className="stock-line in">● В наличии · доставка по Бишкеку сегодня-завтра · оплата при получении</div>
            : <div className="stock-line">○ Под заказ со склада · {ORDER_DAYS} · предоплата не нужна</div>}

          <p className="what">{d?.about ?? summary(p)}</p>

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

          {d?.result && (
            <section className="sec">
              <div className="sec-h">Что будет с кожей</div>
              <div className="timeline">
                {d.result.map(([when, what]) => (
                  <div className="tl" key={when}><b>{when}</b><span>{what}</span></div>
                ))}
              </div>
            </section>
          )}

          {d?.actives && (
            <section className="sec">
              <div className="sec-h">Что внутри</div>
              <div className="acts">
                {d.actives.map(a => (
                  <div className="act" key={a.label}><b>{a.label}</b><span>{a.text}</span></div>
                ))}
              </div>
            </section>
          )}

          {d?.combo && (
            <section className="sec">
              <div className="sec-h">С чем сочетать</div>
              <ul className="dots plain combo">
                {d.combo.map(c => <li key={c}>🤝 {c}</li>)}
              </ul>
            </section>
          )}

          {d?.tip && <div className="tip">💡 {d.tip}</div>}

          {d?.faq && (
            <section className="sec">
              <div className="sec-h">Частые вопросы</div>
              <div className="faq-in">
                {d.faq.map(([q, a]) => (
                  <details key={q}><summary>{q}</summary><p>{a}</p></details>
                ))}
              </div>
            </section>
          )}

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
              <div className="similar-head">Другие наши товары</div>
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

        {/* на телефоне кнопка заказа всегда под рукой */}
        <a className="m-buy" href={orderLink(p)} target="_blank" rel="noreferrer">
          <span>{som(price(p))}</span>
          Заказать в WhatsApp
        </a>
      </div>
    </div>
  )
}
