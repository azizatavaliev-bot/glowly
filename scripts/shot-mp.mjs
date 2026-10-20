// каталог «как маркетплейс»: телефон и компьютер, с прокруткой — проверяем липкие категории и автоподгрузку
import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5280/'
const b = await chromium.launch()
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await m.goto(url, { waitUntil: 'networkidle' })
await m.evaluate(() => { localStorage.removeItem('lilo.cart'); document.querySelector('.catalog .grid').scrollIntoView() })
await m.evaluate(() => scrollBy(0, -120))
await m.waitForTimeout(900)
await m.locator('.catalog .card .buy').nth(1).click()
await m.waitForTimeout(2600)
await m.screenshot({ path: '/tmp/mp-1.png' })
for (let i = 0; i < 6; i++) { await m.evaluate(() => scrollBy(0, 4000)); await m.waitForTimeout(300) }
await m.waitForTimeout(600)
await m.screenshot({ path: '/tmp/mp-2.png' })
console.log('карточек после прокрутки:', await m.locator('.catalog .card').count(), 'overflow', await m.evaluate(() => document.documentElement.scrollWidth - innerWidth))
const d = await b.newPage({ viewport: { width: 1440, height: 900 } })
await d.goto(url, { waitUntil: 'networkidle' })
await d.waitForTimeout(800)
await d.evaluate(() => { const g = document.querySelector('.catalog .grid'); scrollTo(0, g.getBoundingClientRect().top + scrollY - 190) })
await d.waitForTimeout(900)
await d.screenshot({ path: '/tmp/mp-d.png' })
await b.close()
