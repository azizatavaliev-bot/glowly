type Props = {
  favCount: number
  onCatalog: () => void
  onRoutine: () => void
  onFav: () => void
  cartCount: number
  onCart: () => void
  wa: string
}

const I = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
// тонкие линейные значки вместо эмодзи: на разных телефонах эмодзи выглядят по-разному и спорят с логотипом
const ICON = {
  catalog: 'M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z',
  routine: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z',
  fav: 'M12 20s-7-4.4-7-9.6A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.4C19 15.6 12 20 12 20z',
  cart: 'M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2',
  chat: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3v-3H6a2 2 0 0 1-2-2V6z',
}

/** Нижняя панель как в приложении — на телефоне главные действия всегда под большим пальцем. */
export default function MobileBar({ favCount, onCatalog, onRoutine, onFav, cartCount, onCart, wa }: Props) {
  return (
    <nav className="mbar">
      <button onClick={onCatalog}>
        <span><I d={ICON.catalog} /></span>Каталог
      </button>
      <button onClick={onRoutine}>
        <span><I d={ICON.routine} /></span>Подбор
      </button>
      <button onClick={onFav} className="mbar-fav">
        <span><I d={ICON.fav} />{favCount > 0 && <i>{favCount}</i>}</span>Избранное
      </button>
      <button onClick={onCart} className="mbar-cart">
        <span><I d={ICON.cart} />{cartCount > 0 && <i>{cartCount}</i>}</span>Корзина
      </button>
      <a href={wa} target="_blank" rel="noreferrer" className="mbar-wa">
        <span><I d={ICON.chat} /></span>Написать
      </a>
    </nav>
  )
}
