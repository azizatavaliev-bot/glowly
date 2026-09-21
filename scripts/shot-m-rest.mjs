import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
for (const [sel, name] of [['.perks', 'perks'], ['#routine', 'routine'], ['.how', 'how'], ['.faq', 'faq']]) {
  await p.evaluate(s => document.querySelector(s).scrollIntoView(), sel)
  await p.waitForTimeout(700)
  await p.screenshot({ path: `/tmp/mr-${name}.png` })
}
// проверяем нижнюю панель: кнопка «Подбор» должна доводить до конструктора
await p.locator('.mbar button').nth(1).click()
await p.waitForTimeout(900)
await p.screenshot({ path: '/tmp/mr-tap.png' })
await b.close()
