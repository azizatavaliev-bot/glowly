import { chromium } from 'playwright'
import fs from 'fs'
const vids = JSON.parse(fs.readFileSync('src/data/videos.json', 'utf8'))
const id = Object.keys(vids)[5]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 1050 } })
await p.goto(`http://localhost:5280/?p=${id}`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await p.evaluate(() => document.querySelector('.modal').scrollTo(0, 700))
await p.waitForTimeout(600)
await p.screenshot({ path: '/tmp/vid.png' })
await b.close()
