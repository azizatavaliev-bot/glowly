import { useMemo, useState } from 'react'
import type { Product } from '../types'
import { cover } from '../photo'
import { price, som } from '../pricing'
import { split, full } from '../name'
import { NEEDS } from '../needs'

type Props = { all: Product[]; onOpen: (p: Product) => void; wa: (text: string) => string }

const SKIN = [
  { key: 'oily', label: 'Жирная', emoji: '🫧', re: /SEBUM|MATTE|OIL CONTROL|GEL|LIGHT|WATER|ЖИРН|ГЕЛЬ|AZELAIC|TEA TREE|GREEN TEA|PORE/i },
  { key: 'dry', label: 'Сухая', emoji: '🌵', re: /RICH|NOURISH|CERAMIDE|MOISTUR|HYDRAT|BARRIER|CREAM|ПИТАТ|УВЛАЖН|КЕРАМИД|SQUALANE|HYALURON/i },
  { key: 'combo', label: 'Комбинированная', emoji: '⚖️', re: /BALANC|HYDRAT|NIACIN|TONER|ESSENCE|ПЭД|PAD|ЛЁГК/i },
  { key: 'sens', label: 'Чувствительная', emoji: '🌿', re: /SOOTHING|CALMING|CICA|CENTELLA|MUGWORT|PANTHENOL|HEARTLEAF|УСПОКА|ЧУВСТВИТ|ПОЛЫН|MADECASSOSIDE/i },
  { key: 'normal', label: 'Нормальная', emoji: '😊', re: /./ },
]

const GOALS = NEEDS.filter(n => ['acne', 'moist', 'tone', 'age', 'pore', 'calm'].includes(n.key))

// шаги корейского ухода: что ищем на каждом
const STEPS: { key: string; label: string; emoji: string; re: RegExp; not?: RegExp }[] = [
  { key: 'clean', label: 'Очищение', emoji: '🧼', re: /ПЕНКА|FOAM|ГЕЛЬ ДЛЯ УМЫВАНИЯ|CLEANSER|ГИДРОФИЛЬН|CLEANSING OIL|OIL BALM/i, not: /НАБОР|SET|САЛФЕТКИ|TISSUE/i },
  { key: 'toner', label: 'Тонер', emoji: '💦', re: /ТОНЕР|TONER|ПЭДЫ|\bPAD/i, not: /НАБОР|SET|МИСТ/i },
  { key: 'serum', label: 'Сыворотка', emoji: '🧪', re: /^СЫВОРОТКА|^АМПУЛА ДЛЯ ЛИЦА|^ЭССЕНЦИЯ|SERUM|AMPOULE|ESSENCE/i, not: /НАБОР|SET|ВОЛОС|SCALP|ТИНТ|ГУБ|LIP|SPF|КУШОН|CUSHION|РУМЯН|МИСТ|MIST|ПЭДЫ|PAD|ПАТЧ|PATCH|МАСК|MASK|ТОНЕР|TONER|КРЕМ|CREAM/i },
  { key: 'cream', label: 'Крем', emoji: '🫙', re: /КРЕМ ДЛЯ ЛИЦА|ГЕЛЬ-КРЕМ|MOISTURIZER|FACE CREAM|CREAM/i, not: /НАБОР|SET|ГЛАЗ|EYE|SPF|SUN|РУК|HAND|ТЕЛА|BODY|ТОНАЛЬН|КУШОН|CUSHION/i },
  { key: 'spf', label: 'Защита от солнца', emoji: '☀️', re: /СОЛНЦЕЗАЩИТ|SUNSCREEN|SPF/i, not: /НАБОР|SET|КУШОН|CUSHION/i },
]

function pickFor(all: Product[], stepIdx: number, skin: string, goal: string, offset: number): Product | null {
  const step = STEPS[stepIdx]
  const skinRe = SKIN.find(s => s.key === skin)?.re
  const goalRe = GOALS.find(g => g.key === goal)?.re
  const pool = all.filter(p => {
    const t = `${p.full} ${p.spec ?? ''}`
    return step.re.test(t) && !(step.not && step.not.test(t))
  })
  const scored = pool.map(p => {
    const t = `${p.full} ${p.spec ?? ''}`
    let score = 0
    if (goalRe && goalRe.test(t)) score += 3
    if (skinRe && skin !== 'normal' && skinRe.test(t)) score += 2
    if (p.photos?.length) score += 1
    if (p.sale) score += 0.5
    return { p, score }
  }).sort((a, b) => b.score - a.score || a.p.price - b.p.price)
  if (!scored.length) return null
  return scored[offset % scored.length].p
}

export default function RoutineBuilder({ all, onOpen, wa }: Props) {
  const [skin, setSkin] = useState('')
  const [goal, setGoal] = useState('')
  const [offsets, setOffsets] = useState<number[]>([0, 0, 0, 0, 0])
  const ready = skin && goal

  const routine = useMemo(() => {
    if (!ready) return []
    return STEPS.map((s, i) => ({ step: s, p: pickFor(all, i, skin, goal, offsets[i]) }))
  }, [all, skin, goal, offsets, ready])

  const total = routine.reduce((s, r) => s + (r.p ? price(r.p) : 0), 0)
  const swap = (i: number) => setOffsets(o => o.map((v, j) => (j === i ? v + 1 : v)))

  const orderText = () => {
    const lines = routine.filter(r => r.p).map(r => `${r.step.emoji} ${r.step.label}: ${full(r.p!)} — ${som(price(r.p!))}`)
    return `Здравствуйте! Пишу с сайта GLOWLY. Подобрала уход для ${SKIN.find(s => s.key === skin)?.label.toLowerCase()} кожи (${GOALS.find(g => g.key === goal)?.label.toLowerCase()}):\n\n${lines.join('\n')}\n\nИтого: ${som(total)}. Всё есть в наличии?`
  }

  return (
    <section className="routine" id="routine" data-reveal>
      <div className="wrap">
        <div className="routine-head">
          <h2 className="sec-title">Подобрать уход за 30 секунд</h2>
          <p>Два вопроса — и готовая схема из пяти шагов с ценами. Любой шаг можно заменить.</p>
        </div>

        <div className="rb-q">
          <div className="rb-label">1. Какая у вас кожа?</div>
          <div className="rb-opts">
            {SKIN.map(s => (
              <button key={s.key} className={skin === s.key ? 'rb-opt on' : 'rb-opt'} onClick={() => setSkin(s.key)}>
                <span>{s.emoji}</span>{s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={skin ? 'rb-q' : 'rb-q dim'}>
          <div className="rb-label">2. Что хотите улучшить?</div>
          <div className="rb-opts">
            {GOALS.map(g => (
              <button key={g.key} className={goal === g.key ? 'rb-opt on' : 'rb-opt'} onClick={() => setGoal(g.key)}>
                <span>{g.emoji}</span>{g.label}
              </button>
            ))}
          </div>
        </div>

        {ready && (
          <div className="rb-result">
            <div className="rb-steps">
              {routine.map((r, i) => (
                <div className="rb-step" key={r.step.key}>
                  <div className="rb-step-h"><span>{r.step.emoji}</span>{i + 1}. {r.step.label}</div>
                  {r.p ? (
                    <>
                      <button className="rb-pic" onClick={() => onOpen(r.p!)}>
                        {cover(r.p) && <img src={cover(r.p)!} alt="" loading="lazy" />}
                      </button>
                      <div className="rb-brand">{r.p.brand}</div>
                      <div className="rb-name" onClick={() => onOpen(r.p!)}>{split(r.p).title}</div>
                      <div className="rb-sub">{split(r.p).sub}</div>
                      <div className="rb-row">
                        <b>{som(price(r.p))}</b>
                        <button className="rb-swap" onClick={() => swap(i)}>↻ заменить</button>
                      </div>
                    </>
                  ) : <div className="rb-none">Пока нет подходящего</div>}
                </div>
              ))}
            </div>
            <div className="rb-total">
              <div>
                <span>Весь уход</span>
                <b>{som(total)}</b>
                <i>{routine.filter(r => r.p).length} средств · хватит на 2–3 месяца</i>
              </div>
              <a className="add big wa-btn" href={wa(orderText())} target="_blank" rel="noreferrer">
                Заказать весь набор в WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
