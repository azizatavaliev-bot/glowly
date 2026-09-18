import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.fill('.search', 'anua сыворотка')
await p.waitForTimeout(500)
console.log('найдено:', await p.locator('.found').textContent())
await p.screenshot({ path: '/tmp/korshop-m.png' })
await b.close()
