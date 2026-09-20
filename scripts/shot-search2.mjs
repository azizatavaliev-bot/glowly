import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
for (const q of ['анюа', 'медикуб', 'раунд лаб', 'тинт', 'патчи для глаз', 'шампунь']) {
  await p.fill('.search', q)
  await p.waitForTimeout(450)
  console.log(`«${q}» →`, await p.locator('.found b').first().textContent())
}
await b.close()
