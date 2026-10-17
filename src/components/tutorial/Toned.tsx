import type { ReactNode } from 'react'

/** A tutorial instruction led by the tones it speaks of: the colors the
 *  pieces show on the puzzle, filled (a center's color), or `framed` (the
 *  outlines marking the pieces, hollow as on the puzzle). */
export function Toned({
  colors,
  framed = false,
  children,
}: {
  colors: readonly string[]
  framed?: boolean
  children: ReactNode
}) {
  return (
    <span>
      <span className="mr-1.5 inline-flex gap-1 align-middle" aria-hidden>
        {colors.map((color) => (
          <span
            key={color}
            className={`inline-block size-3.5 ${framed ? 'rounded-[3px] border-[3px] bg-slate-800' : 'rounded-sm'}`}
            style={framed ? { borderColor: color } : { backgroundColor: color }}
          />
        ))}
      </span>
      {children}
    </span>
  )
}
