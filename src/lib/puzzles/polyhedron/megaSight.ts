import type { MegaFace, MegaMove, Turn } from '../../core/types'
import { isMegaMove } from '../../core/types'
import { megaCarried } from './megaminx'

/**
 * A Megaminx's solution turned in hand so every turn shows (pure): a
 * dodecahedron hides half its faces, so a turn of a face out of sight is
 * brought in front first, the puzzle turned whole about the vertical (its
 * top kept on top), or, for the face beneath, tipped toward the viewer.
 * Each step then reads as turns in sight, a turn of the puzzle, turns in
 * sight; the turns after it named as the puzzle is then held. The turn
 * chosen shows the most turns after it: about the vertical, any holding is
 * one turn away from any other, so this makes the fewest (about one every
 * three turns: two faces of the top ring in sight, one of the bottom's).
 */

/** The faces in sight from the view the puzzle opens in (three/core/camera.ts:
 *  the front, the right, the top, and the one below between them). */
export const MEGA_IN_SIGHT: readonly MegaFace[] = ['U', 'F', 'R', 'DR']

const whole = (megaFace: MegaFace, amount: MegaMove['amount']): MegaMove => ({
  megaFace,
  amount,
  whole: true,
})

/** About the vertical, the top kept on top; else the face beneath tipped
 *  in front (about the one below in sight, its neighbor). */
const ABOUT_TOP = ([1, 4, 2, 3] as const).map((amount) => whole('U', amount))
const TIPPED = ([2, 3] as const).map((amount) => whole('DR', amount))

type Frame = (face: MegaFace) => MegaFace

/** How many turns in a row, from the first, show with the puzzle held as
 *  `frame` says. */
function shown(turns: readonly MegaMove[], frame: Frame): number {
  const hidden = turns.findIndex((t) => !MEGA_IN_SIGHT.includes(frame(t.megaFace)))
  return hidden < 0 ? turns.length : hidden
}

/** The steps of a solution, a turn of the whole puzzle before each turn
 *  out of sight (the one that shows the most turns after it, the least
 *  turn first), the turns named as the puzzle is held. */
export function megaInSight(steps: readonly (readonly Turn[])[]): Turn[][] {
  let frame: Frame = (face) => face
  const turns = steps.flat().filter((t) => isMegaMove(t) && !t.whole) as MegaMove[]
  let next = 0
  return steps.map((step) =>
    step.flatMap((turn): Turn[] => {
      if (!isMegaMove(turn) || turn.whole) return [turn]
      const ahead = turns.slice(next++)
      const out: Turn[] = []
      if (!MEGA_IN_SIGHT.includes(frame(turn.megaFace))) {
        const was = frame
        const framed = (by: MegaMove): Frame => {
          const to = megaCarried(by)
          return (face) => to(was(face))
        }
        const options = ABOUT_TOP.some((by) => shown(ahead, framed(by))) ? ABOUT_TOP : TIPPED
        // The first of the most shown: the least turn, as listed.
        const best = options.reduce((a, b) =>
          shown(ahead, framed(b)) > shown(ahead, framed(a)) ? b : a,
        )
        out.push(best)
        frame = framed(best)
      }
      out.push({ ...turn, megaFace: frame(turn.megaFace) })
      return out
    }),
  )
}
