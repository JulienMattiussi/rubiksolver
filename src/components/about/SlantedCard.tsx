import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Bolded } from '@/components/ui/Bolded'
import { useHeight } from '@/hooks/useHeight'
import { roundedPath } from './roundedPath'

/** The panel's cards' corners (`rounded-2xl`, px). */
const RADIUS = 16
/** How far before the slant the cut text starts fading, and over how
 *  much (px). */
const FADE_FROM = 56
const FADE_OVER = 18
/** How long the pointer stays on a card before it opens, and off it
 *  before it closes (ms): passing by on the way to a panel does neither. */
const OPEN_AFTER = 400
const CLOSE_AFTER = 250

/** A mask fading the text of a `width` by `height` card past its slanted
 *  side, which draws in to `column` px at `resting` px down, and past
 *  that depth: white up to `FADE_FROM` px before, blurred out across.
 *  Its other sides reach far out, so they do not fade. */
function fadeMask(
  width: number,
  height: number,
  column: number,
  resting: number,
  left: boolean,
): string {
  const far = 100
  const slope = (width - column) / resting
  const along = (y: number) => width - FADE_FROM - slope * y
  const bottom = resting - FADE_FROM / 2
  const corners: [number, number][] = [
    [-far, -far],
    [along(-far), -far],
    [along(bottom), bottom],
    [-far, bottom],
  ]
  const points = corners.map(([x, y]) => `${left ? x : width - x},${y}`).join(' ')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><filter id='f' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='${FADE_OVER}'/></filter><polygon points='${points}' fill='white' filter='url(#f)'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** A text's first sentence, set apart as its lead, and the rest. */
function splitLead(text: string): [string, string] {
  const at = text.indexOf('. ')
  return at < 0 ? [text, ''] : [text.slice(0, at + 1), text.slice(at + 2)]
}

/**
 * A card of the panel's kind (its background, border, corners, shadow,
 * padding), cut on the puzzle's side along a slant, so it hugs the
 * puzzle's top (useAboutShape): `top` px wide at the top, `column` px at
 * `drop` px down, its bottom, above the puzzle's top corner whatever the
 * screen's height. Its text is laid out as in a plain card and fades out
 * toward the slant and the bottom that cut it (`fadeMask`); hovered, the
 * card squares up and opens down to show it whole (`height` px), once the
 * pointer has stayed on it a moment (`OPEN_AFTER`). It tells
 * its text's height (`onMeasure`), so that both cards share the taller's.
 */
export function SlantedCard({
  label,
  title,
  text,
  top: width,
  column,
  drop,
  height,
  side,
  shown,
  onMeasure,
}: {
  label: string
  title?: string
  /** Its words between `**` in bold. */
  text: string
  top: number
  column: number
  drop: number
  height: number
  /** The side of the screen it stands on; the puzzle is on the other. */
  side: 'left' | 'right'
  /** Open whatever the pointer does (the page's arrival, useArrival). */
  shown: boolean
  onMeasure: (height: number) => void
}) {
  const content = useRef<HTMLDivElement>(null)
  const measured = useHeight(content)
  useEffect(() => onMeasure(measured), [measured, onMeasure])
  const [open, setOpen] = useState(false)
  const opened = open || shown
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const toggle = (next: boolean) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(next), next ? OPEN_AFTER : CLOSE_AFTER)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  // Reached by the keyboard: open at once, its border lit.
  const [focused, setFocused] = useState(false)
  const focus = (next: boolean) => {
    clearTimeout(timer.current)
    setFocused(next)
    setOpen(next)
  }
  const left = side === 'left'
  const [lead, rest] = splitLead(text)
  const resting = Math.min(height, drop)
  // Slanted, or squared up: as many corners either way, so one turns into
  // the other.
  const corners: [number, number][] = [
    [0, 0],
    [width, 0],
    opened ? [width, height] : [column, resting],
    [0, opened ? height : resting],
  ]
  const outline = corners.map(([x, y]): [number, number] => (left ? [x, y] : [width - x, y]))
  const path = `path('${roundedPath(outline, RADIUS)}')`
  const morph = 'duration-300 ease-out motion-reduce:transition-none'
  const mask = opened || height === 0 ? 'none' : fadeMask(width, height, column, resting, left)
  return (
    <div
      className={`absolute top-5 ${left ? 'left-[22.5rem]' : 'right-[22.5rem]'} drop-shadow-2xl ${
        opened ? 'z-10' : ''
      }`}
      style={{ width, height }}
    >
      {/* Hovered where it shows only: the clip bounds the pointer too. */}
      <div
        role="region"
        aria-label={title ?? label}
        tabIndex={0}
        className={`pointer-events-auto absolute inset-0 bg-slate-900/85 outline-none backdrop-blur transition-[clip-path] ${morph}`}
        style={{ clipPath: path }}
        onMouseEnter={() => toggle(true)}
        onMouseLeave={() => !focused && toggle(false)}
        onFocus={() => focus(true)}
        onBlur={() => focus(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      >
        {/* The whole card's frame, as the mask's. */}
        <div
          className="absolute inset-0 p-5"
          style={{
            maskImage: mask,
            WebkitMaskImage: mask,
            maskSize: '100% 100%',
            maskRepeat: 'no-repeat',
          }}
        >
          <div ref={content} className={left ? '' : 'text-right'}>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-amber-300/90 uppercase">
              {label}
            </p>
            {title && (
              <h2 className="mb-3 bg-gradient-to-r from-sky-300 via-white to-violet-300 bg-clip-text text-2xl leading-tight font-black text-transparent">
                {title}
              </h2>
            )}
            <p className="text-[15px] leading-snug text-slate-100 [text-wrap:pretty]">
              <Bolded text={lead} />
            </p>
            {rest && (
              <p className="mt-2 text-sm leading-relaxed text-slate-400 [text-wrap:pretty]">
                <Bolded text={rest} strong="font-semibold text-slate-100" />
              </p>
            )}
          </div>
        </div>
      </div>
      {/* More to read: the card opens on hover. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute rounded-full bg-slate-800/90 px-2 pb-1 text-sm leading-none font-bold tracking-widest text-sky-300 transition-opacity ${morph} ${
          left ? 'left-5' : 'right-5'
        } ${opened || height <= resting ? 'opacity-0' : 'opacity-100'}`}
        style={{ top: resting - 30 }}
      >
        …
      </span>
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        width={width}
        height={height}
      >
        <path
          className={`transition-[d] ${morph}`}
          style={{ d: path } as CSSProperties}
          fill="none"
          // The focus ring's color (focus-visible:outline-sky-400) when
          // reached by the keyboard.
          stroke={focused ? '#38bdf8' : 'rgb(51 65 85 / 0.7)'}
          strokeWidth={focused ? 2 : 1}
        />
      </svg>
    </div>
  )
}
