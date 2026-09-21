import { chromium } from 'playwright'
const URL = 'https://azizatavaliev-bot.github.io/glowly/'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 950 } })
const errs = []
p.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 120)))
p.on('response', r => r.status() >= 400 && errs.push(`${r.status()} ${r.url().slice(0, 90)}`))
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await p.screenshot({ path: '/tmp/prod1.png' })
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
await p.waitForTimeout(1200)
await p.screenshot({ path: '/tmp/prod2.png' })
await p.locator('.card .pic').first().click()
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/prod3.png' })
console.log('товаров:', await p.locator('.found b').first().textContent())
console.log('ошибки:', errs.length ? errs.slice(0, 5) : 'нет')
await b.close()
