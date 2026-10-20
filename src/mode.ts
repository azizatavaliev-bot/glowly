/**
 * Оптовая витрина — тот же сайт по адресу /opt: те же товары, но оптовая цена, минимальная сумма
 * заказа и своя корзина. Ссылку Азиз даёт оптовикам сам; из розничной витрины на неё ссылок нет,
 * чтобы обычный покупатель не видел оптовых цен.
 */
// два входа в опт: путь /opt и отдельный адрес вида opt.lilo.asia — один и тот же код, разная витрина
// отдельный оптовый сайт собирается с VITE_OPT=1 (свой сервис Railway); /opt и opt.* — тоже опт
export const OPT = import.meta.env.VITE_OPT === '1' || /^\/opt\/?$/.test(location.pathname) || /^opt\./.test(location.hostname)

/** Минимальная сумма оптового заказа в сомах. */
export const OPT_MIN = 15000

if (OPT) {
  // оптовые цены поисковикам не показываем
  const m = document.createElement('meta')
  m.name = 'robots'; m.content = 'noindex'
  document.head.appendChild(m)
  document.title = 'LILO Cosmetics — опт'
}
