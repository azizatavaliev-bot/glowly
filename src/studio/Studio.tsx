import { useMemo, useRef, useState } from 'react'
import { savePng } from './png'
import data from '../data/products.json'
import type { Product } from '../types'
import { matches, score } from '../search'
import { split } from '../name'
import { cover } from '../photo'
import { price, som } from '../pricing'
import { LOGO_VARIANT, type LogoVariant } from '../brand'
import Logo from '../components/Logo'
import { Post, TYPES, DETAILS, caption, type PostType } from './posts'
import './studio.css'

/**
 * Студия постов Instagram — служебная страница /insta, для Азиза, покупатели её не видят.
 * Выбрал тип и товары → превью → «Скачать PNG» и «Скопировать подпись».
 */
const ALL = (data.products as Product[]).filter(p => p.photos?.length)

// стартовые наборы, чтобы превью не было пустым
const DEFAULTS: Record<PostType, number[]> = {
  товар: [528], подборка: [534, 510, 32, 64], совет: [528], вопрос: [427], уход: [566, 440, 174, 427],
}
const byIds = (ids: number[]) => ids.map(id => ALL.find(p => p.id === id)).filter((p): p is Product => !!p)

export default function Studio() {
  const [type, setType] = useState<PostType>('товар')
  const [items, setItems] = useState<Product[]>(byIds(DEFAULTS.товар))
  const [head, setHead] = useState('Хиты LILO')
  const [faq, setFaq] = useState(0)
  const [logo, setLogo] = useState<LogoVariant>(LOGO_VARIANT)
  const [cut, setCut] = useState(true)
  const [opt, setOpt] = useState(true)
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const node = useRef<HTMLDivElement>(null)
  const cfg = TYPES.find(t => t.key === type)!
  const needDetails = type === 'совет' || type === 'вопрос'

  const pickType = (t: PostType) => { setType(t); setItems(byIds(DEFAULTS[t])); setFaq(0) }
  const add = (p: Product) => {
    setItems(cur => cfg.max === 1 ? [p] : cur.some(x => x.id === p.id) ? cur : [...cur, p].slice(-cfg.max))
    setQ(''); setFaq(0)
  }

  const found = useMemo(() => {
    const pool = needDetails ? ALL.filter(p => type === 'совет' ? DETAILS[p.id]?.tip : DETAILS[p.id]?.faq?.length) : ALL
    if (!q.trim()) return needDetails ? pool : []
    return pool.filter(p => matches(p, q)).sort((a, b) => score(b, q) - score(a, q)).slice(0, 12)
  }, [q, type, needDetails])

  const input = { type, items, title: head, faq, logo, cut, opt }
  const text = caption(input)
  const ready = items.length >= cfg.min

  const download = async () => {
    if (!node.current) return
    setBusy(true)
    try {
      await savePng(node.current, 1080, 1350, `lilo ${type} ${items.map(p => p.id).join('-')}.png`)
    } finally { setBusy(false) }
  }
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="studio">
      <aside className="st-side">
        <div className="st-brand"><Logo /><span>студия постов</span></div>

        <div className="st-block">
          <div className="st-h">Тип поста</div>
          <div className="st-types">
            {TYPES.map(t => (
              <button key={t.key} className={t.key === type ? 'on' : ''} onClick={() => pickType(t.key)}>
                <b>{t.label}</b><span>{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="st-block">
          <div className="st-h">Товары <i>{items.length} из {cfg.max}</i></div>
          <div className="st-chosen">
            {items.map(p => (
              <div key={p.id}>
                <img src={cover(p) ?? ''} alt="" />
                <span>{p.brand} · {split(p).title}</span>
                <button onClick={() => setItems(items.filter(x => x.id !== p.id))} aria-label="Убрать">×</button>
              </div>
            ))}
          </div>
          <input className="st-search" value={q} onChange={e => setQ(e.target.value)}
            placeholder={needDetails ? 'Товары с описанием ниже, или поиск…' : 'Найти товар: «крем», «anua», «spf»…'} />
          {!!found.length && (
            <div className="st-found">
              {found.map(p => (
                <button key={p.id} onClick={() => add(p)}>
                  <img src={cover(p) ?? ''} alt="" />
                  <span><b>{p.brand}</b>{split(p).title} · {split(p).sub}</span>
                  <u>{som(price(p))}</u>
                </button>
              ))}
            </div>
          )}
        </div>

        {type === 'подборка' && (
          <div className="st-block">
            <div className="st-h">Заголовок <i>последнее слово — курсивом</i></div>
            <input className="st-search" value={head} onChange={e => setHead(e.target.value)} />
          </div>
        )}

        {type === 'вопрос' && items[0] && (
          <div className="st-block">
            <div className="st-h">Вопрос</div>
            <div className="st-faq">
              {(DETAILS[items[0].id]?.faq ?? []).map(([qq], i) => (
                <button key={i} className={i === faq ? 'on' : ''} onClick={() => setFaq(i)}>{qq}</button>
              ))}
            </div>
          </div>
        )}

        <label className="st-check">
          <input type="checkbox" checked={opt} onChange={e => setOpt(e.target.checked)} />
          Оптовый пост <span>оптовая цена, «опт от 15 000 с», подпись для оптовиков</span>
        </label>

        <label className="st-check">
          <input type="checkbox" checked={cut} onChange={e => setCut(e.target.checked)} />
          Фото без фона <span>выключите, если товар вырезался криво</span>
        </label>

        <div className="st-block">
          <div className="st-h">Логотип <i>на сайте сейчас: {LOGO_VARIANT}</i></div>
          <div className="st-logos">
            {(['drop', 'serif', 'spaced', 'line'] as LogoVariant[]).map(v => (
              <button key={v} className={v === logo ? 'on' : ''} onClick={() => setLogo(v)}><Logo variant={v} /></button>
            ))}
          </div>
        </div>
      </aside>

      <main className="st-main">
        <div className="st-stage">
          <div className="st-scale"><div ref={node}><Post {...input} /></div></div>
        </div>
        <div className="st-actions">
          <button className="st-primary" onClick={download} disabled={!ready || busy}>
            {busy ? 'Сохраняю…' : ready ? 'Скачать PNG 1080×1350' : `Нужно товаров: ${cfg.min}`}
          </button>
        </div>
        <div className="st-cap">
          <div className="st-h">Подпись к посту</div>
          <textarea value={text} readOnly rows={8} />
          <button onClick={copy}>{copied ? 'Скопировано ✓' : 'Скопировать подпись'}</button>
        </div>
      </main>
    </div>
  )
}
