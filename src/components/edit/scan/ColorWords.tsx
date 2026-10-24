import { Fragment, type ReactNode } from 'react'
import type { Color } from '@/lib/core/types'
import { COLOR_HEX, VARIANT_SKIN } from '@/three/core/colors'
import { Bolded } from '@/components/ui/Bolded'
import { SCAN_WHERE } from '@/components/ui/styles'

/** A text naming colors, each name led by a swatch of its color (the
 *  first time it comes, in the order they come), or on a mirror, of its
 *  thickness (`size`, from 0 the thinnest to 1 the thickest: a gold bar as
 *  long); its words between `**` (where to hold it) in bold. */
export function ColorWords({
  text,
  colors,
}: {
  text: string
  colors: readonly { readonly color: Color; readonly name: string; readonly size?: number }[]
}) {
  const marks = colors
    .map((c) => ({ ...c, at: text.indexOf(c.name) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
  const parts: ReactNode[] = []
  let from = 0
  for (const { color, at, size } of marks) {
    if (at < from) continue
    parts.push(
      <Fragment key={color}>
        <Bolded text={text.slice(from, at)} strong={SCAN_WHERE} />
        <span
          aria-hidden
          className="mr-1 inline-block rounded-sm align-middle ring-1 ring-black/40"
          style={
            size === undefined
              ? { backgroundColor: COLOR_HEX[color], width: '0.875rem', height: '0.875rem' }
              : {
                  backgroundColor: VARIANT_SKIN.mirror,
                  width: `${0.4 + 1.6 * size}rem`,
                  height: '0.6rem',
                }
          }
        />
      </Fragment>,
    )
    from = at
  }
  return (
    <>
      {parts}
      <Bolded text={text.slice(from)} strong={SCAN_WHERE} />
    </>
  )
}
