/**
 * Оптовый прайс LILO в Excel — для оптовиков и для съёмки: бренд, товар, вариант, опт, розница.
 * Цены считаются тем же pricing.ts, что на сайте /opt.
 *
 *   npx tsx scripts/opt_price.ts      → ~/Desktop/LILO опт <дата>.csv (открывается в Excel)
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

Object.assign(globalThis, { location: { pathname: '/opt', hostname: 'lilo.asia' }, document: { head: { appendChild() {} }, createElement: () => ({}) } })
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const { retail, optPrice, OPT_TIERS } = await import('../src/pricing')
const { split } = await import('../src/name')
const { OPT_MIN } = await import('../src/mode')
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/products.json'), 'utf8'))

const q = (s: unknown) => `"${String(s ?? '').replace(/"/g, '""')}"`
const rows = [...data.products]
  .sort((a, b) => a.brand.localeCompare(b.brand) || a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name))
  .map(p => [p.brand, p.cat, split(p).title, split(p).sub, p.spec ?? '', ...OPT_TIERS.map(t => optPrice(p, t.k)), retail(p)].map(q).join(';'))
const head = ['Бренд', 'Категория', 'Товар', 'Название', 'Вариант', ...OPT_TIERS.map(t => `Опт ${t.label}`), 'Розница, сом'].map(q).join(';')
const note = `${q(`LILO Cosmetics — оптовый прайс от ${data.meta.date}. Заказ от ${OPT_MIN.toLocaleString('ru-RU')} сом. lilo.asia/opt · WhatsApp`)}`
const file = path.join(os.homedir(), 'Desktop', `LILO опт ${data.meta.date}.csv`)
// BOM и «;» — так Excel на Mac сразу открывает кириллицу по колонкам
fs.writeFileSync(file, '﻿' + [note, '', head, ...rows].join('\n'))
console.log(`✓ ${rows.length} товаров → ${file}`)
