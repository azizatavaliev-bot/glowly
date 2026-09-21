import { chromium } from 'playwright'
const URL = process.env.URL || 'http://localhost:5280/'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(1400)
await p.screenshot({ path: '/tmp/m1.png' })            // первый экран без прокрутки
await p.evaluate(() => window.scrollBy(0, 640))
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/m2.png' })            // хиты + липкий поиск в шапке
await p.evaluate(() => document.querySelector('.needs').scrollIntoView())
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/m3.png' })
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/m4.png' })
await b.close()
