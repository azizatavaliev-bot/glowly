import { chromium, devices } from 'playwright'
const URL = process.env.URL || 'https://azizatavaliev-bot.github.io/glowly/'
const list = [
  { n: 'iphone-se', w: 375, h: 667 },
  { n: 'iphone-14', w: 393, h: 852 },
  { n: 'android', w: 360, h: 800 },
  { n: 'ipad', w: 768, h: 1024 },
]
const b = await chromium.launch()
for (const d of list) {
  const p = await b.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: 2, isMobile: d.w < 700, hasTouch: true })
  const errs = []
  p.on('pageerror', e => errs.push(e.message.slice(0, 100)))
  await p.goto(URL, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1400)
  await p.screenshot({ path: `/tmp/d-${d.n}-1.png` })
  // горизонтальное переполнение — главный враг мобильной вёрстки
  const over = await p.evaluate(() => {
    const bad = []
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2)) {
        const cls = (el.className || '').toString().split(' ')[0]
        if (cls && !bad.includes(cls)) bad.push(cls)
      }
    })
    return { scrollW: document.documentElement.scrollWidth, winW: window.innerWidth, bad: bad.slice(0, 8) }
  })
  await p.evaluate(() => document.querySelector('#catalog').scrollIntoView())
  await p.waitForTimeout(800)
  await p.screenshot({ path: `/tmp/d-${d.n}-2.png` })
  await p.locator('.card .pic').first().click()
  await p.waitForTimeout(700)
  await p.screenshot({ path: `/tmp/d-${d.n}-3.png` })
  console.log(`${d.n} ${d.w}px · scroll ${over.scrollW}/${over.winW} · за краем: ${over.bad.join(', ') || 'нет'} · ошибки: ${errs.length ? errs[0] : 'нет'}`)
  await p.close()
}
await b.close()
