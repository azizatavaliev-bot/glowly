import { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string }
type Props = { value: string; options: Option[]; onChange: (v: string) => void }

export default function Dropdown({ value, options, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', off)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', off)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const current = options.find(o => o.value === value)?.label ?? ''

  return (
    <div className={open ? 'dd open' : 'dd'} ref={box}>
      <button className="dd-btn" onClick={() => setOpen(o => !o)}>
        {current}<span className="dd-arrow" />
      </button>
      {open && (
        <div className="dd-menu">
          {options.map(o => (
            <button key={o.value} className={o.value === value ? 'on' : ''}
              onClick={() => { onChange(o.value); setOpen(false) }}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
