// обход всей главной на телефоне: кадры по экрану, чтобы смотреть вёрстку секций подряд
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5280/'
const b = await chromium.launch()
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
await m.goto(url, { waitUntil: 'networkidle' })
await m.waitForTimeout(1200)
const sels = ['.hero', '.perks', '.sales', '.needs', '#routine', '.how', '.faq', 'footer']
for (const [i, s] of sels.entries()) {
  const ok = await m.evaluate(q => { const e = document.querySelector(q); if (!e) return false; window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 60); return true }, s)
  if (!ok) { console.log('нет секции', s); continue }
  await m.waitForTimeout(500)
  await m.screenshot({ path: `/tmp/tour-${i}.png` })
}
console.log('overflow', await m.evaluate(() => document.documentElement.scrollWidth - innerWidth))
console.log(await m.evaluate(() => [...document.querySelectorAll('section,footer,div.catalog')].map(e => e.className || e.tagName).join(' | ')))
await b.close()
