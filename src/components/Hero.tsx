import { useEffect, useRef } from 'react'
import type { Product } from '../types'

type Props = {
  total: number
  brands: number
  date: string
  shots: Product[]
  onStart: () => void
}

export default function Hero({ total, brands, date, shots, onStart }: Props) {
  const stage = useRef<HTMLDivElement>(null)

  // лёгкий параллакс коллажа за курсором
  useEffect(() => {
    const el = stage.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2
        const y = (e.clientY / window.innerHeight - 0.5) * 2
        el.style.setProperty('--px', String(x))
        el.style.setProperty('--py', String(y))
      })
    }
    window.addEventListener('mousemove', move)
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  return (
    <section className="hero">
      <div className="hero-glow" aria-hidden />
      <div className="wrap hero-in">
        <div className="hero-txt">
          <div className="eyebrow">Оптовый прайс · обновлён {date}</div>
          <h1>
            Корейская косметика<br />
            <i>напрямую</i> из Сеула
          </h1>
          <p>
            {total} позиций в наличии, {brands} брендов. Отгружаем коробами,
            цены в долларах за штуку — без наценок посредников.
          </p>
          <div className="hero-cta">
            <button className="btn-main" onClick={onStart}>Открыть каталог</button>
            <a className="btn-ghost" href="https://wa.me/996559050618" target="_blank" rel="noreferrer">
              Написать в WhatsApp
            </a>
          </div>
          <dl className="stats">
            <div><dt>{total}</dt><dd>позиций</dd></div>
            <div><dt>{brands}</dt><dd>брендов</dd></div>
            <div><dt>USD</dt><dd>цена за штуку</dd></div>
          </dl>
        </div>

        <div className="stage" ref={stage}>
          {shots.slice(0, 5).map((p, i) => (
            <figure className={`shot s${i + 1}`} key={p.id}>
              <img src={`/img/${p.img}`} alt={p.name} />
              <figcaption>{p.brand}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
