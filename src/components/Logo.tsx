import { LOGO_VARIANT, type LogoVariant } from '../brand'

/**
 * Логотип LILO. Вариант выбирается в brand.ts (LOGO_VARIANT) — один раз на весь сайт и все посты.
 *  - drop   — «lılo» курсивной антиквой, над «ı» вместо точки капля терракотой (основной с 14.10)
 *  - serif  — «lilo.» строчными курсивной антиквой, точка терракотой
 *  - spaced — «L I L O» тонким гротеском в разрядку, точка-капля справа
 *  - line   — прежний: буквы линиями, капля в «O»
 * Цвет букв берётся из color родителя.
 */
export default function Logo({ caption = true, variant = LOGO_VARIANT }: { caption?: boolean; variant?: LogoVariant }) {
  if (variant === 'drop') return (
    <span className="lg lg-serif lg-drop2" aria-label="LILO">
      <b>l<span className="dl">ı<svg viewBox="0 0 10 14" aria-hidden><path d="M5 0C7.6 4 9.4 6.6 9.4 9.1a4.4 4.4 0 0 1-8.8 0C.6 6.6 2.4 4 5 0Z" /></svg></span>lo</b>
      {caption && <small>cosmetics</small>}
    </span>
  )
  if (variant === 'serif') return (
    <span className="lg lg-serif" aria-label="LILO">
      <b>lilo<i>.</i></b>
      {caption && <small>cosmetics</small>}
    </span>
  )
  if (variant === 'spaced') return (
    <span className="lg lg-spaced" aria-label="LILO">
      <b>LILO<i /></b>
      {caption && <small>cosmetics</small>}
    </span>
  )
  return (
    <span className="lg">
      <svg viewBox="0 0 110 40" role="img" aria-label="LILO">
        <g fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3.5V36.5H21" />
          <path d="M33 3.5V36.5" />
          <path d="M45 3.5V36.5H62" />
          <circle cx="89" cy="20" r="16.5" />
        </g>
        <path className="lg-drop" d="M89 10.5c4.2 5.2 6.4 8.6 6.4 11.9a6.4 6.4 0 0 1-12.8 0c0-3.3 2.2-6.7 6.4-11.9Z" />
      </svg>
      {caption && <i>cosmetics</i>}
    </span>
  )
}
