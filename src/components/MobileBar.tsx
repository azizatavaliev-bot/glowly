type Props = {
  favCount: number
  onCatalog: () => void
  onRoutine: () => void
  onFav: () => void
  wa: string
}

/** Нижняя панель как в приложении — на телефоне главные действия всегда под большим пальцем. */
export default function MobileBar({ favCount, onCatalog, onRoutine, onFav, wa }: Props) {
  return (
    <nav className="mbar">
      <button onClick={onCatalog}>
        <span>🛍</span>Каталог
      </button>
      <button onClick={onRoutine}>
        <span>✨</span>Подбор
      </button>
      <button onClick={onFav} className="mbar-fav">
        <span>♥{favCount > 0 && <i>{favCount}</i>}</span>Избранное
      </button>
      <a href={wa} target="_blank" rel="noreferrer" className="mbar-wa">
        <span>💬</span>Написать
      </a>
    </nav>
  )
}
