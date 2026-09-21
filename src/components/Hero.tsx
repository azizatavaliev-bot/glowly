import { useEffect, useRef, useState } from 'react'
import type { Product } from '../types'
import { cover } from '../photo'
import { price, som } from '../pricing'
import { split } from '../name'
import { matches, score } from '../search'

type Props = {
  all: Product[]
  total: number
  brands: number
  columns: Product[][]
  onStart: () => void
  onSearch: (q: string) => void
  onOpen: (p: Product) => void
  wa: string
}

// слово в заголовке меняется — три причины купить за один взгляд
const WORDS = ['ниже магазинов', 'прямо из Кореи', 'с доставкой сегодня', 'с оплатой при получении']

/** Число «набегает» от нуля при появлении — так цифры читаются, а не пролистываются. */
function useCountUp(target: number, ms = 1100): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export default function Hero({ all, total, brands, columns, onStart, onSearch, onOpen, wa }: Props) {
  const [word, setWord] = useState(0)
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const n1 = useCountUp(total)
  const n2 = useCountUp(brands, 900)

  useEffect(() => {
    const id = setInterval(() => setWord(w => (w + 1) % WORDS.length), 2600)
    return () => clearInterval(id)
  }, [])

  // подсветка за курсором — мягкое пятно, не свечение
  useEffect(() => {
    const el = box.current
    if (!el || window.matchMedia('(pointer: coarse)').matches) return
    const move = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('mousemove', move)
    return () => el.removeEventListener('mousemove', move)
  }, [])

  // живые подсказки: до 5 товаров под строкой
  const hits = q.trim().length >= 2
    ? all.filter(p => matches(p, q)).sort((a, b) => score(b, q) - score(a, q)).slice(0, 5)
    : []
  const submit = () => { if (q.trim()) { onSearch(q.trim()); setFocus(false) } }

  return (
    <section className="hero hero-v3" ref={box}>
      <div className="blobs" aria-hidden>
        <span className="blob b1" /><span className="blob b2" /><span className="blob b3" />
      </div>
      <div className="spot" aria-hidden />

      <div className="wrap hero-in">
        <div className="hero-txt">
          <span className="pill"><i /> Доставка по Бишкеку · оплата при получении</span>
          <h1>
            Корейский уход<br />
            <span className="swap">
              {WORDS.map((w, i) => (
                <em key={w} className={i === word ? 'on' : ''}>{w}</em>
              ))}
            </span>
          </h1>
          <p>
            <span className="only-wide">
              {total} средств и {brands} корейских брендов. Привозим напрямую со склада,
              поэтому дешевле, чем в городе.
            </span>
            <span className="only-narrow">
              {total} средств из Кореи. Дешевле, чем в городе.
            </span>
          </p>

          <div className={focus && hits.length ? 'hero-search open' : 'hero-search'}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 150)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Что ищете? Например, «крем от прыщей» или ANUA"
            />
            <button onClick={submit}>Найти</button>
            {focus && hits.length > 0 && (
              <div className="hero-hits">
                {hits.map(p => (
                  <button key={p.id} onMouseDown={() => onOpen(p)}>
                    {cover(p) && <img src={cover(p)!} alt="" />}
                    <span><b>{split(p).title}</b><i>{p.brand} · {split(p).sub}</i></span>
                    <u>{som(price(p))}</u>
                  </button>
                ))}
                <button className="all" onMouseDown={submit}>Все результаты по «{q}» →</button>
              </div>
            )}
          </div>

          <div className="hero-cta">
            <button className="btn-main" onClick={onStart}>Смотреть каталог</button>
            <a className="btn-ghost" href={wa} target="_blank" rel="noreferrer">Подобрать уход в WhatsApp</a>
          </div>

          <dl className="stats">
            <div><dt>{n1}</dt><dd>средств в наличии</dd></div>
            <div><dt>{n2}</dt><dd>корейских брендов</dd></div>
            <div><dt>1 день</dt><dd>доставка по городу</dd></div>
          </dl>
          <div className="stats-line">
            <b>{total}</b> средств · <b>{brands}</b> брендов · доставка <b>за день</b>
          </div>
        </div>

        <div className="hero-rail">
          <div className="hero-rail-h">Хиты продаж</div>
          <div className="rail">
            {columns.flat().slice(0, 12).map(p => (
              <button className="sale-card" key={p.id} onClick={() => onOpen(p)}>
                <img src={cover(p) ?? ''} alt="" loading="lazy" />
                <b>{p.brand}</b>
                <i>{split(p).title}</i>
                <u>{som(price(p))}</u>
              </button>
            ))}
          </div>
        </div>

        <div className="lanes" aria-hidden>
          {columns.map((col, i) => (
            <div className={`lane lane-${i + 1}`} key={i}>
              <div className="lane-track">
                {[...col, ...col].map((p, j) => (
                  <figure className="tile" key={`${p.id}-${j}`} onClick={() => onOpen(p)}>
                    <img src={cover(p) ?? ''} alt="" loading={j < 3 ? 'eager' : 'lazy'} />
                    <figcaption>
                      <b>{p.brand}</b>
                      <u>{som(price(p))}</u>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
          <div className="float f1">🇰🇷 Оригинал со склада</div>
          <div className="float f2">▶ 384 видеообзора</div>
          <div className="float f3">💸 Дешевле города</div>
        </div>
      </div>
    </section>
  )
}
