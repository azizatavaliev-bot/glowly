import type { Product } from '../types'
import { cover } from '../photo'
import { price, som } from '../pricing'

type Props = {
  total: number
  brands: number
  date: string
  columns: Product[][]
  onStart: () => void
  wa: string
}

export default function Hero({ total, brands, columns, onStart, wa }: Props) {
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden />
      <div className="wrap hero-in">
        <div className="hero-txt">
          <span className="pill">Доставка по Бишкеку · оплата при получении</span>
          <h1>
            Корейский уход<br />
            по ценам <i>ниже</i><br />
            магазинов
          </h1>
          <p>
            {total} средств и {brands} корейских брендов в наличии. Привозим напрямую со склада,
            поэтому у нас дешевле, чем в городе.
          </p>
          <div className="hero-cta">
            <button className="btn-main" onClick={onStart}>Смотреть каталог</button>
            <a className="btn-ghost" href={wa} target="_blank" rel="noreferrer">
              Подобрать уход в WhatsApp
            </a>
          </div>
          <dl className="stats">
            <div><dt>{total}</dt><dd>средств в наличии</dd></div>
            <div><dt>{brands}</dt><dd>корейских брендов</dd></div>
            <div><dt>1 день</dt><dd>доставка по городу</dd></div>
          </dl>
        </div>

        <div className="lanes" aria-hidden>
          {columns.map((col, i) => (
            <div className={`lane lane-${i + 1}`} key={i}>
              <div className="lane-track">
                {[...col, ...col].map((p, j) => (
                  <figure className="tile" key={`${p.id}-${j}`}>
                    <img src={cover(p) ?? ''} alt="" loading={j < 3 ? 'eager' : 'lazy'} />
                    <figcaption>
                      <b>{p.brand}</b>
                      <u>{som(price(p))}</u>
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
