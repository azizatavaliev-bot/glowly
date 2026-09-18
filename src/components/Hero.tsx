import type { Product } from '../types'

type Props = {
  total: number
  brands: number
  date: string
  columns: Product[][]
  onStart: () => void
}

export default function Hero({ total, brands, date, columns, onStart }: Props) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden />
      <div className="wrap hero-in">
        <div className="hero-txt">
          <span className="pill">Прямые поставки из Кореи</span>
          <h1>
            Косметика,<br />
            которую <i>ждут</i><br />
            полки
          </h1>
          <p>
            {total} позиций и {brands} брендов на складе. Отгружаем коробами,
            цена в долларах за штуку — без наценок посредников.
          </p>
          <div className="hero-cta">
            <button className="btn-main" onClick={onStart}>Смотреть каталог</button>
            <a className="btn-ghost" href="https://wa.me/996559050618" target="_blank" rel="noreferrer">
              Запросить прайс
            </a>
          </div>
          <dl className="stats">
            <div><dt>{total}</dt><dd>позиций в наличии</dd></div>
            <div><dt>{brands}</dt><dd>брендов Кореи</dd></div>
            <div><dt>{date.split(' ').slice(0, 2).join(' ')}</dt><dd>прайс обновлён</dd></div>
          </dl>
        </div>

        <div className="lanes" aria-hidden>
          {columns.map((col, i) => (
            <div className={`lane lane-${i + 1}`} key={i}>
              <div className="lane-track">
                {[...col, ...col].map((p, j) => (
                  <figure className="tile" key={`${p.id}-${j}`}>
                    <img src={`/img/${p.img}`} alt="" loading={j < 3 ? 'eager' : 'lazy'} />
                    <figcaption>
                      <b>{p.brand}</b>
                      <u>${p.price.toFixed(2)}</u>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
          <div className="lanes-fade" />
        </div>
      </div>
    </section>
  )
}
