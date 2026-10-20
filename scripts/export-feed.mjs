// Выгрузка ленты: все публикации PNG + подписи + порядок публикации + превью шахматной сетки
import { chromium } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const OUT = path.join(os.homedir(), 'Desktop/LILO Инста/Лента 72 публикации')
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 1000 } })
await p.goto('http://localhost:5280/feed', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000)
// подписи и даты берём из самой страницы ленты
const meta = await p.evaluate(async () => {
  const m = await import('/src/studio/Feed.tsx')
  return m.PLAN.map((it, i) => ({ kind: it.kind, date: m.dateOf(i), cap: m.capOf(it), name: it.kind === 'reel' ? `${it.top} · ${it.big}` : `${it.input.type} · ${it.input.items[0].brand}` }))
})
await p.locator('.fd-phone').screenshot({ path: path.join(OUT, '00 сетка профиля.png') })
const e = await b.newPage({ viewport: { width: 1200, height: 2000 } })
await e.goto('http://localhost:5280/export', { waitUntil: 'networkidle' }); await e.waitForTimeout(2500)
const plan = []
for (const [i, m] of meta.entries()) {
  const n = String(i + 1).padStart(2, '0')
  const base = `${n} ${m.kind === 'reel' ? 'Reels' : 'пост'} — ${m.name.replace(/[/\\:]/g, ' ')}`
  const el = e.locator(`[data-n="${i}"]`); await el.scrollIntoViewIfNeeded(); await e.waitForTimeout(150)
  await el.screenshot({ path: path.join(OUT, base + '.png') })
  fs.writeFileSync(path.join(OUT, base + '.txt'), m.cap)
  plan.push(`${n}. ${m.date} — ${m.kind === 'reel' ? 'Reels (обложка)' : 'Пост'} — ${m.name}`)
}
fs.writeFileSync(path.join(OUT, '00 порядок публикации.txt'),
`ЛЕНТА LILO OPT — 72 публикации, 12 недель
Публиковать строго по номерам: 01 первой, 72 последней.

ШАХМАТКА
В сетке 3 колонки, поэтому чередование «рилс — пост» само даёт шахматный порядок:
рилсы светлые (крем), посты тёмные (песок, советы — шоколад).
Если пропустить публикацию или поменять местами две соседние — шахматка собьётся.
Сторис и удалённые посты на сетку не влияют.

НЕДЕЛЯ
Пн — Reels · Вт — пост · Ср — Reels · Чт — пост · Пт — Reels · Сб — пост · Вс — только сторис
Обложка Reels — файл «Reels — ….png»: в Instagram при публикации «Изменить обложку» → «Добавить из галереи».

ПЛАН
${plan.join('\n')}
`)
await b.close()
console.log('готово', meta.length, OUT)
