import { chromium } from 'playwright'
const b = await chromium.launch()
const errs = []
const d = await b.newPage({ viewport: { width: 1440, height: 1000 } })
d.on('pageerror', e => errs.push(e.message.slice(0, 120)))
await d.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await d.evaluate(() => document.querySelector('#catalog').scrollIntoView())
await d.waitForTimeout(900)
await d.screenshot({ path: '/tmp/s1.png' })
await d.goto('http://localhost:5280/?p=440', { waitUntil: 'networkidle' })   // Dokdo Toner — в наличии
await d.waitForTimeout(700)
await d.screenshot({ path: '/tmp/s2.png', clip: { x: 640, y: 40, width: 620, height: 340 } })
await d.goto('http://localhost:5280/?p=86', { waitUntil: 'networkidle' })    // Relief Sun — под заказ
await d.waitForTimeout(700)
await d.screenshot({ path: '/tmp/s3.png', clip: { x: 640, y: 40, width: 620, height: 340 } })
console.log('ошибки:', errs.length ? errs : 'нет')
await b.close()
