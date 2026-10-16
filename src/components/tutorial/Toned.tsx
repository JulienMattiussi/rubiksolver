import type { ReactNode } from 'react'

/** A tutorial instruction led by the tones it speaks of (their swatches:
 *  the colors the pieces show on the puzzle). */
export function Toned({ colors, children }: { colors: readonly string[]; children: ReactNode }) {
  return (
    <span>
      <span className="mr-1.5 inline-flex gap-1 align-middle" aria-hidden>
        {colors.map((color) => (
          <span
            key={color}
            className="inline-block size-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      {children}
    </span>
  )
}
