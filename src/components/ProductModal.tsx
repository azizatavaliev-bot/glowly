import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { summary, volume, money, benefits, forWhom, steps, tags } from '../describe'
import { photos } from '../photo'

type Props = {
  p: Product
  qty: number
  kgs: boolean
  rate: number
  money: (usd: number) => string
  setQty: (n: number) => void
  onClose: () => void
  onBrand: (b: string) => void
  similar: Product[]
  onOpen: (p: Product) => void
}

const WA = '996559050618'

export default function ProductModal({
  p, qty, money: fmt, setQty, onClose, onBrand, similar, onOpen,
}: Props) {
  const v = volume(p)
  const m = money(p)
  const good = benefits(p)
  const who = forWhom(p)
  const how = steps(p)
  const acts = tags(p)
  const shots = photos(p)
  const [shot, setShot] = useState(0)
  const [copied, setCopied] = useState(false)
  useEffect(() => { setShot(0); setCopied(false) }, [p.id])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const share = () => {
    const url = `${location.origin}${location.pathname}?p=${p.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ask = () => {
    const text = `Здравствуйте! Интересует: ${p.full}${p.spec ? ` [${p.spec}]` : ''}, штрихкод ${p.barcode ?? '—'}. Цена $${p.price.toFixed(2)}. Есть в наличии?`
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Закрыть">×</button>

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
            {p.pack && <div><span>Упаковка</span><b>{p.pack}</b></div>}
            {p.barcode && (
              <div>
                <span>Штрихкод</span>
                <b className="mono">{p.barcode.trim().split(/\s+/).join(' / ')}</b>
              </div>
            )}
            {p.exp && <div><span>Годен до</span><b>{p.exp}</b></div>}
            <div><span>Категория</span><b>{p.cat}</b></div>
            {p.sale && <div><span>Акция</span><b>{p.sale.replace(/ [KS]$/, '')}</b></div>}
          </div>
        </div>

        <div className="m-body">
          <button className="brand link-brand" onClick={() => { onBrand(p.brand); onClose() }}>
            {p.brand} →
          </button>
          <h2>{p.name}</h2>
          {p.spec && <div className="spec big">{p.spec}</div>}

          <div className="m-price">
            <div className="price big">{fmt(p.price)}<em>/{p.unit}</em></div>
            {m.perMl && <span className="per">{fmt(m.perMl)} за 1 {v.text.includes('г') ? 'г' : 'мл'}</span>}
          </div>

          <p className="what">{summary(p)}</p>

          <section className="sec">
            <div className="sec-h">Чем полезен</div>
            <ul className="dots">
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

          {!!acts.length && (
            <section className="sec">
              <div className="sec-h">Активные компоненты</div>
              <div className="acts">
                {acts.map(a => (
                  <div className="act" key={a.label}>
                    <b>{a.label}</b>
                    <span>{a.text}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="calc">
            <div className="calc-head"><span>Цены</span></div>
            <div className="calc-grid">
              <div><span>Закуп за штуку</span><b>{fmt(p.price)}</b></div>
              {m.box
                ? <div><span>Короб {m.boxQty} шт</span><b>{fmt(m.box)}</b></div>
                : <div><span>Упаковка</span><b>{p.pack ?? '—'}</b></div>}
              {m.perMl && (
                <div className="wide">
                  <span>Цена за 1 {v.text.includes('г') ? 'г' : 'мл'}</span>
                  <b>{fmt(m.perMl)}</b>
                </div>
              )}
            </div>
          </div>

          <div className="m-actions">
            {qty > 0 ? (
              <div className="qty big">
                <button onClick={() => setQty(qty - 1)}>−</button>
                <input value={qty} onChange={e => setQty(Math.max(0, Number(e.target.value) || 0))} />
                <button onClick={() => setQty(qty + 1)}>+</button>
              </div>
            ) : (
              <button className="add big" onClick={() => setQty(p.packQty ?? 1)}>
                В заказ{p.packQty ? ` · короб ${p.packQty} шт` : ''}
              </button>
            )}
            <div className="m-sub">
              <button className="ghost-sm" onClick={ask}>Спросить в WhatsApp</button>
              <button className="ghost-sm" onClick={share}>
                {copied ? 'Ссылка скопирована' : 'Ссылка на товар'}
              </button>
              {p.barcode && (
                <button className="ghost-sm" onClick={() => navigator.clipboard.writeText(p.barcode!)}>
                  Копировать штрихкод
                </button>
              )}
            </div>
            {qty > 0 && <div className="sum">В заказе: {qty} {p.unit} на {fmt(p.price * qty)}</div>}
          </div>

          {!!similar.length && (
            <div className="similar">
              <div className="similar-head">Ещё у {p.brand}</div>
              <div className="similar-row">
                {similar.map(s => (
                  <button key={s.id} onClick={() => onOpen(s)}>
                    {photos(s)[0] && <img src={photos(s)[0]} alt="" />}
                    <i>{s.name}</i>
                    <u>{fmt(s.price)}</u>
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
