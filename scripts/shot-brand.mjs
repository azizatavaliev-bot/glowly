import { chromium } from 'playwright'
const URL = process.env.URL || 'http://localhost:5280/'
const b = await chromium.launch()
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await m.goto(URL, { waitUntil: 'networkidle' }); await m.waitForTimeout(1000)
await m.screenshot({ path: '/tmp/b1.png' })
const d = await b.newPage({ viewport: { width: 1440, height: 900 } })
await d.goto(URL, { waitUntil: 'networkidle' }); await d.waitForTimeout(900)
await d.screenshot({ path: '/tmp/b2.png' })
console.log('заголовок вкладки:', await d.title())
await b.close()
