import { chromium } from 'playwright'
const queries = ['выпадения', 'sunscreen', 'набор масок', 'тинт']
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1050 } })
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
let i = 0
for (const q of queries) {
  await p.fill('.search', q)
  await p.waitForTimeout(700)
  await p.locator('.card .pic').first().click()
  await p.waitForTimeout(500)
  await p.screenshot({ path: `/tmp/b${++i}.png` })
  await p.locator('.modal .x').click()
  await p.waitForTimeout(300)
}
await b.close()
