import { useEffect, useState } from 'react'

/** Короткое уведомление внизу экрана: «добавлено в избранное» и прочее. */
export function toast(text: string) {
  window.dispatchEvent(new CustomEvent('glowly:toast', { detail: text }))
}

export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    let timer: number
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail)
      clearTimeout(timer)
      timer = window.setTimeout(() => setMsg(null), 2200)
    }
    window.addEventListener('glowly:toast', on)
    return () => { window.removeEventListener('glowly:toast', on); clearTimeout(timer) }
  }, [])

  if (!msg) return null
  return <div className="toast">{msg}</div>
}
