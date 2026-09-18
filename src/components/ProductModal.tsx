import { useEffect, useState } from 'react'
import type { Product } from '../types'
import { what, tags, howTo, volume, money } from '../describe'

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
  const [markup, setMarkup] = useState(80)
  const v = volume(p)
  const m = money(p, 1 + markup / 100)
  const list = tags(p)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

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
            {p.img ? <img src={`/img/${p.img}`} alt={p.name} /> : <div className="noimg">нет фото</div>}
            {p.sale && <span className="badge">{p.sale.replace('АКЦИЯ ', '−').replace(/ [KS]$/, '')}</span>}
          </div>
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

          <p className="what">{what(p)} {howTo(p)}</p>

          {!!list.length && (
            <div className="tags">
              {list.map(t => (
                <div className="tag" key={t.label}>
                  <b>{t.label}</b>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="calc">
            <div className="calc-head">
              <span>Считаем деньги</span>
              <label>
                наценка
                <input type="range" min={20} max={200} step={5} value={markup}
                  onChange={e => setMarkup(Number(e.target.value))} />
                <b>{markup}%</b>
              </label>
            </div>
            <div className="calc-grid">
              <div><span>Закуп за штуку</span><b>{fmt(p.price)}</b></div>
              {m.box && <div><span>Короб {m.boxQty} шт</span><b>{fmt(m.box)}</b></div>}
              <div><span>Розница ориентир</span><b className="acc">{fmt(m.retail)}</b></div>
              <div><span>Прибыль со штуки</span><b className="acc">{fmt(m.marginPerItem)}</b></div>
              {m.box && (
                <div className="wide">
                  <span>Прибыль с короба при {markup}%</span>
                  <b className="acc">{fmt(m.marginPerItem * (m.boxQty ?? 1))}</b>
                </div>
              )}
            </div>
            <div className="calc-note">Розница — ваш ориентир, не рекомендация бренда. Двигайте ползунок под свой рынок.</div>
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
                    {s.img && <img src={`/img/${s.img}`} alt="" />}
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
