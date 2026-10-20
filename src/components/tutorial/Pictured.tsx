import { Fragment, type ReactNode } from 'react'
import type { CubeShape } from '@/lib/core/shapes'
import type { Cube } from '@/lib/core/types'
import type { Legend } from '@/lib/teach/tutorial'
import { PiecePicture } from './LegendGrid'

/**
 * An instruction naming pieces of a puzzle told by shape (`Tutorial.legend`):
 * each name followed by the piece's picture, the side it shows now (front,
 * or back once turned over), framed in the tone it wears on the puzzle (the
 * piece picked, the one in its place). Without a legend, the words as they
 * are.
 */
/** A line round a picture's own outline (not its box): its shape shifted
 *  a little each way, in that color, behind it. */
const outline = (color: string) =>
  [
    [1.5, 0],
    [-1.5, 0],
    [0, 1.5],
    [0, -1.5],
  ]
    .map(([x, y]) => `drop-shadow(${x}px ${y}px 0 ${color})`)
    .join(' ')

export function Pictured({
  text,
  pieces,
  name,
  cube,
  shape,
  legend,
}: {
  text: string
  /** The pieces it names, by index, each with its tone's color (none: a
   *  piece no tone marks, the one the hold is told by). */
  pieces: readonly { readonly piece: number; readonly tone?: string }[]
  name: (index: number) => string
  cube: Cube
  shape: CubeShape
  legend?: Legend
}) {
  if (!legend) return <>{text}</>
  // Cut after each name, in the order they come in the words.
  const marks = pieces
    .map(({ piece, tone }) => ({
      piece,
      tone,
      at: text.indexOf(name(piece)),
      length: name(piece).length,
    }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at)
  const parts: ReactNode[] = []
  let from = 0
  for (const { piece, tone, at, length } of marks) {
    if (at < from) continue
    parts.push(
      <Fragment key={piece}>
        {text.slice(from, at + length)}
        <span
          className="mx-1 inline-block align-middle"
          style={tone ? { filter: outline(tone) } : undefined}
        >
          <PiecePicture
            shape={shape}
            piece={piece}
            back={legend.turned(cube[piece]!)}
            className="block size-8"
          />
        </span>
      </Fragment>,
    )
    from = at + length
  }
  return (
    <>
      {parts}
      {text.slice(from)}
    </>
  )
}
