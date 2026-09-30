import { chromium } from 'playwright'
const URL = process.env.URL || 'http://localhost:5280/'
const b = await chromium.launch()
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const errs = []; m.on('pageerror', e => errs.push(e.message.slice(0, 100)))
await m.goto(URL + '?p=528', { waitUntil: 'networkidle' }); await m.waitForTimeout(1200)
await m.screenshot({ path: '/tmp/c1.png' })
for (const [i, y] of [[2, 700], [3, 1500], [4, 2400], [5, 3300]]) {
  await m.evaluate(v => document.querySelector('.modal').scrollTo(0, v), y)
  await m.waitForTimeout(350)
  await m.screenshot({ path: `/tmp/c${i}.png` })
}
const box = await m.evaluate(() => { const r = document.querySelector('.m-buy').getBoundingClientRect(); return { top: Math.round(r.top), win: innerHeight } })
console.log('липкая кнопка заказа:', box, '· ошибки:', errs.length ? errs : 'нет')
await b.close()
