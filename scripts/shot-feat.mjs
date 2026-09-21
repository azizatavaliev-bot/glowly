import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const errs = []
p.on('pageerror', e => errs.push(e.message.slice(0, 120)))
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
// конструктор ухода
await p.evaluate(() => document.querySelector('#routine').scrollIntoView())
await p.waitForTimeout(700)
await p.locator('.rb-opt').nth(0).click()
await p.locator('.rb-opt').nth(5).click()
await p.waitForTimeout(800)
await p.screenshot({ path: '/tmp/f1.png' })
// сердечки и бейджи в каталоге
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
await p.waitForTimeout(900)
await p.locator('.card .heart').nth(0).click()
await p.locator('.card .heart').nth(2).click()
await p.locator('.card .heart').nth(3).click()
await p.waitForTimeout(400)
await p.screenshot({ path: '/tmp/f2.png' })
// панель избранного
await p.locator('.fav-btn').click()
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/f3.png' })
await p.locator('.cart .x').click()
// карточка с новыми кнопками
await p.locator('.card .pic').first().click()
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/f4.png' })
console.log('ошибки:', errs.length ? errs : 'нет')
await b.close()
