import { useEffect } from 'react'

/** Показывает элементы с data-reveal по мере попадания в экран. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.shown)')
    if (!els.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(el => el.classList.add('shown'))
      return
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('shown')
          io.unobserve(e.target)
        }
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
