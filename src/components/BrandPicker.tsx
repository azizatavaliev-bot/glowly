import { useEffect, useMemo, useState } from 'react'

type Props = {
  brands: string[]
  counts: Record<string, number>
  value: string
  onPick: (b: string) => void
  onClose: () => void
}

export default function BrandPicker({ brands, counts, value, onPick, onClose }: Props) {
  const [q, setQ] = useState('')

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return brands.filter(b => !s || b.toLowerCase().includes(s))
  }, [q, brands])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="picker" onClick={e => e.stopPropagation()}>
        <div className="picker-head">
          <h2>Бренды</h2>
          <button className="x" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <input className="search" autoFocus placeholder="Найти бренд…"
          value={q} onChange={e => setQ(e.target.value)} />
        <div className="picker-grid">
          <button className={value === 'Все' ? 'pk on' : 'pk'} onClick={() => onPick('Все')}>
            Все бренды<i>{Object.values(counts).reduce((s, n) => s + n, 0)}</i>
          </button>
          {list.map(b => (
            <button key={b} className={value === b ? 'pk on' : 'pk'} onClick={() => onPick(b)}>
              {b}<i>{counts[b] ?? 0}</i>
            </button>
          ))}
          {!list.length && <div className="empty">Такого бренда в прайсе нет</div>}
        </div>
      </div>
    </div>
  )
}
