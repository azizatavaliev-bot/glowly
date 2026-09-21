import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const errs = []
p.on('pageerror', e => errs.push(e.message.slice(0, 120)))
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await p.screenshot({ path: '/tmp/vm1.png' })
await p.fill('.hero-search input', 'тонер')
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/vm2.png' })
console.log('ошибки:', errs.length ? errs : 'нет')
await b.close()
