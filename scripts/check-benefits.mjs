import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:5280/', { waitUntil: 'networkidle' })
const res = await p.evaluate(async () => {
  const d = await import('/src/describe.ts')
  const data = await fetch('/src/data/products.json').then(r => r.json())
  const counts = {}
  const weak = []
  for (const prod of data.products) {
    const n = d.benefits(prod).length
    counts[n] = (counts[n] ?? 0) + 1
    if (n < 2) weak.push(prod.full)
  }
  return { counts, weak: weak.slice(0, 10), weakTotal: weak.length }
})
console.log(JSON.stringify(res, null, 1))
await b.close()
