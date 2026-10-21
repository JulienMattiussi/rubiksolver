import { Fragment, type ReactNode } from 'react'
import type { Color } from '@/lib/core/types'
import { COLOR_HEX } from '@/three/core/colors'

/** A text naming colors, each name led by a swatch of its color (the
 *  first time it comes, in the order they come). */
export function ColorWords({
  text,
  colors,
}: {
  text: string
  colors: readonly { readonly color: Color; readonly name: string }[]
}) {
  const marks = colors
    .map((c) => ({ ...c, at: text.indexOf(c.name) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
  const parts: ReactNode[] = []
  let from = 0
  for (const { color, at } of marks) {
    if (at < from) continue
    parts.push(
      <Fragment key={color}>
        {text.slice(from, at)}
        <span
          aria-hidden
          className="mr-1 inline-block size-3.5 rounded-sm align-middle ring-1 ring-black/40"
          style={{ backgroundColor: COLOR_HEX[color] }}
        />
      </Fragment>,
    )
    from = at
  }
  return (
    <>
      {parts}
      {text.slice(from)}
    </>
  )
}
