/**
 * Логотип LILO: буквы нарисованы линиями, а не шрифтом — выглядят одинаково на любом телефоне.
 * В «O» капля сыворотки акцентным цветом. Цвет букв берётся из color родителя.
 */
export default function Logo({ caption = true }: { caption?: boolean }) {
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
