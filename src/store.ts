import { useEffect, useState } from 'react'

/** Список id в localStorage, реактивный между компонентами через событие окна. */
function useIdList(key: string, max = 100): [number[], (id: number) => void, (id: number) => void, () => void] {
  const read = (): number[] => {
    try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
  }
  const [list, setList] = useState<number[]>(read)

  useEffect(() => {
    const sync = () => setList(read())
    window.addEventListener(`store:${key}`, sync)
    return () => window.removeEventListener(`store:${key}`, sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const write = (next: number[]) => {
    localStorage.setItem(key, JSON.stringify(next.slice(0, max)))
    window.dispatchEvent(new Event(`store:${key}`))
  }
  const toggle = (id: number) => {
    const cur = read()
    write(cur.includes(id) ? cur.filter(x => x !== id) : [id, ...cur])
  }
  const push = (id: number) => write([id, ...read().filter(x => x !== id)])
  const clear = () => write([])
  return [list, toggle, push, clear]
}

/** Избранное: сердечко на карточке, список для заказа одним сообщением. */
export function useFavorites() {
  const [ids, toggle, , clear] = useIdList('glowly.fav')
  return { ids, has: (id: number) => ids.includes(id), toggle, clear }
}

/** Недавно смотрели: последние 12 открытых карточек. */
export function useRecent() {
  const [ids, , push] = useIdList('glowly.recent', 12)
  return { ids, push }
}
