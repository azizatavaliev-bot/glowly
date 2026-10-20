import { PLAN } from './Feed'
import { Post } from './posts'
import { ReelCover } from './Format'
import { HIGHLIGHTS, SLIDES, Highlight } from './highlights'
import './studio.css'
import './format.css'
import './feed.css'

/** /export — все публикации ленты в натуральную величину: посты 1080×1350, обложки рилсов 1080×1920. Снимает scripts/export-feed.mjs. */
export default function Export() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: 20, background: '#888' }}>
      {PLAN.map((it, i) => it.kind === 'post'
        ? <div key={i} data-n={i} className="tone-dark" style={{ width: 1080, height: 1350 }}><Post {...it.input} /></div>
        : <div key={i} data-n={i} style={{ width: 1080, height: 1920 }}><ReelCover id={it.id} top={it.top} big={it.big} w={1080} /></div>)}
      {/* актуальное: обложка кружка и сторис внутри */}
      {HIGHLIGHTS.map((h, k) => (
        <div key={h.key} style={{ display: 'contents' }}>
          <div data-hl={`${k + 1} ${h.label}/00 обложка`} style={{ width: 1080, height: 1920, background: '#f7f4f0', display: 'grid', placeItems: 'center' }}><Highlight h={h} size={760} /></div>
          {SLIDES[h.key].map((s, j) => <div key={j} data-hl={`${k + 1} ${h.label}/${String(j + 1).padStart(2, '0')}`} style={{ width: 1080, height: 1920 }}>{s}</div>)}
        </div>))}
    </div>
  )
}
