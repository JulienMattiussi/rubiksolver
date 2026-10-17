import { useId } from 'react'

/** Sparkles round the cup: where they shine, how big, and when (seconds). */
const SPARKLES = [
  { x: 14, y: 22, size: 7, delay: 0 },
  { x: 106, y: 18, size: 9, delay: 0.6 },
  { x: 100, y: 70, size: 6, delay: 1.1 },
  { x: 20, y: 76, size: 5, delay: 1.6 },
  { x: 60, y: 4, size: 6, delay: 0.3 },
]

/** A four-pointed sparkle centered on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`

/**
 * A gold cup for a puzzle solved in the tutorial: shaded gold, a light
 * across it, a star on its front, a glow behind, and sparkles that twinkle
 * round it (still for who asks for reduced motion).
 */
export function GoldTrophy({ className }: { className?: string }) {
  const id = useId()
  const gold = `${id}-gold`
  const dark = `${id}-dark`
  const glow = `${id}-glow`
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b45309" />
          <stop offset="0.3" stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#fef3c7" />
          <stop offset="0.7" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id={dark} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* The glow behind it. */}
      <circle cx="60" cy="52" r="52" fill={`url(#${glow})`} />
      {/* The handles. */}
      <path
        d="M30 30 C8 30 8 62 36 64"
        fill="none"
        stroke={`url(#${dark})`}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M90 30 C112 30 112 62 84 64"
        fill="none"
        stroke={`url(#${dark})`}
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* The cup, its rim, the stem and the base. */}
      <path d="M28 22 H92 V40 C92 64 76 78 60 78 C44 78 28 64 28 40 Z" fill={`url(#${gold})`} />
      <ellipse cx="60" cy="22" rx="32" ry="5" fill="#fde68a" />
      <ellipse cx="60" cy="22" rx="27" ry="3" fill="#b45309" opacity="0.5" />
      <path d="M54 78 H66 L68 94 H52 Z" fill={`url(#${gold})`} />
      <rect x="40" y="94" width="40" height="9" rx="2" fill={`url(#${dark})`} />
      <rect x="34" y="103" width="52" height="12" rx="3" fill={`url(#${gold})`} />
      <rect x="46" y="106" width="28" height="6" rx="1.5" fill="#78350f" opacity="0.45" />
      {/* The star on its front. */}
      <path
        d="M60 34 L64.4 43.2 L74.5 44.5 L67 51.4 L69 61.4 L60 56.4 L51 61.4 L53 51.4 L45.5 44.5 L55.6 43.2 Z"
        fill="#fef3c7"
        stroke="#b45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* The light across the cup. */}
      <path
        d="M36 28 C36 50 42 64 50 70"
        fill="none"
        stroke="#fffbeb"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Sparkles, twinkling one after the other. */}
      {SPARKLES.map(({ x, y, size, delay }) => (
        <path
          key={`${x}-${y}`}
          d={sparkle(x, y, size)}
          fill="#fef9c3"
          className="motion-safe:animate-pulse"
          style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px` }}
        />
      ))}
    </svg>
  )
}
