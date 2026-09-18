type Props = { items: string[]; onPick: (b: string) => void }

export default function Marquee({ items, onPick }: Props) {
  const line = [...items, ...items]
  return (
    <div className="marquee" aria-label="Бренды в наличии">
      <div className="marquee-track">
        {line.map((b, i) => (
          <button key={`${b}-${i}`} onClick={() => onPick(b)} tabIndex={i < items.length ? 0 : -1}>
            {b}<span>✦</span>
          </button>
        ))}
      </div>
    </div>
  )
}
