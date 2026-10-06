/**
 * Имя магазина — в одном месте. Поменялось название → правим здесь,
 * логотип, тексты и сообщения в WhatsApp подхватят сами.
 */
export const BRAND = 'LILO'            // крупная часть логотипа
export const BRAND_ACCENT = 'COSMETICS' // акцентная часть
export const BRAND_FULL = 'LILO Cosmetics'
export const WA = '996559050618'

export const waLink = (text: string) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`
