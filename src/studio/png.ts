import { toPng } from 'html-to-image'

/**
 * Сохранение поста/сторис в PNG. Шрифты встраиваем сами data-URL'ами: иначе html-to-image
 * лезет в CSS Google Fonts, не может его прочитать и подставляет системный шрифт.
 */
let fontCSS: Promise<string> | null = null
const asData = async (url: string) => {
  const blob = await (await fetch(url)).blob()
  return new Promise<string>(ok => { const r = new FileReader(); r.onload = () => ok(r.result as string); r.readAsDataURL(blob) })
}
const embedFonts = () => fontCSS ??= Promise.all(
  ['/fonts/Manrope.ttf', '/fonts/PlayfairDisplay-Italic.ttf', '/fonts/Cormorant.ttf', '/fonts/Cormorant-Italic.ttf'].map(asData),
).then(([sans, pf, cg, cgi]) => `@font-face{font-family:'Manrope';src:url(${sans});font-weight:200 800}
@font-face{font-family:'Playfair Display';src:url(${pf});font-style:italic;font-weight:400 900}
@font-face{font-family:'Cormorant';src:url(${cg});font-weight:300 700}
@font-face{font-family:'Cormorant';src:url(${cgi});font-style:italic;font-weight:300 700}`)

export async function savePng(el: HTMLElement, w: number, h: number, name: string) {
  await document.fonts.ready
  const url = await toPng(el, { width: w, height: h, pixelRatio: 1, cacheBust: true, fontEmbedCSS: await embedFonts() })
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
}
