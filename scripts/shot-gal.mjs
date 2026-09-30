import { chromium } from 'playwright'
const URL = process.env.URL || 'http://localhost:5280/'
const b = await chromium.launch()
// телефон: галерея со свайпом
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await m.goto(URL + '?p=427', { waitUntil: 'networkidle' }); await m.waitForTimeout(1000)
await m.screenshot({ path: '/tmp/g1.png' })
await m.evaluate(() => { const g = document.querySelector('.m-swipe'); g.scrollTo({ left: g.clientWidth }) })
await m.waitForTimeout(500)
await m.screenshot({ path: '/tmp/g2.png' })
console.log('точек в галерее:', await m.locator('.dots-nav i').count(), '· активная:', await m.locator('.dots-nav i.on').count())
// десктоп: старый вид не сломан
const d = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await d.goto(URL + '?p=427', { waitUntil: 'networkidle' }); await d.waitForTimeout(800)
await d.screenshot({ path: '/tmp/g3.png' })
console.log('десктоп: .m-pic виден =', await d.locator('.m-pic').isVisible(), '· свайп скрыт =', !(await d.locator('.m-swipe').isVisible()), '· липкая кнопка скрыта =', !(await d.locator('.m-buy').isVisible()))
await b.close()
