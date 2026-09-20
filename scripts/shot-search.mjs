import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
for (const q of ['крем от прыщей', 'увлажнение', 'тонер', 'rhtv', 'от морщин', 'анюа', 'подарок']) {
  await p.fill('.search', q)
  await p.waitForTimeout(500)
  console.log(`«${q}» →`, await p.locator('.found b').first().textContent())
}
await p.fill('.search', '')
await p.locator('.need').nth(0).click()
await p.waitForTimeout(700)
await p.screenshot({ path: '/tmp/nd2.png' })
console.log('полка «От прыщей» →', await p.locator('.found b').first().textContent())
await b.close()
