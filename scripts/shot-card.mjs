import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
const qs = ['выпадения', 'sunscreen', 'тинт']
let i = 0
for (const q of qs) {
  await p.fill('.search', q)
  await p.waitForTimeout(700)
  await p.locator('.card .pic').first().click()
  await p.waitForTimeout(500)
  await p.screenshot({ path: `/tmp/c${++i}.png`, fullPage: false })
  await p.locator('.modal .x').click()
  await p.waitForTimeout(250)
}
await b.close()
