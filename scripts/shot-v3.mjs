import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const errs = []
p.on('pageerror', e => errs.push(e.message.slice(0, 140)))
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1600)
await p.screenshot({ path: '/tmp/v1.png' })
await p.waitForTimeout(2700)  // ждём смену слова в заголовке
await p.screenshot({ path: '/tmp/v2.png' })
// живые подсказки в героическом поиске
await p.fill('.hero-search input', 'тонер anua')
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/v3.png' })
await p.keyboard.press('Escape')
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/v4.png' })
console.log('ошибки:', errs.length ? errs : 'нет')
await b.close()
