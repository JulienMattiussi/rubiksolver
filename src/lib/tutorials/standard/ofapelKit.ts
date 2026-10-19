import { FACE_COLOR, solvedCube } from '../../core/cube'
import { faceOfNormal, FACE_NORMAL } from '../../core/geometry'
import { CUBE_HOLDS } from '../../core/hold'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Move } from '../../core/types'
import type { Target } from '../../teach/kit'
import { gestureChain, type Gesture } from '../../teach/macros'
import { topTurn } from './cornerTrigger'

/**
 * What the steps of the Ofapel tutorial share (ofapel.ts): its colors, its
 * gestures (each formula from each hold, the top turned first) and their
 * chains, its frame (yellow down, but on its side for the last step: the
 * first steps read it turned back up), and how a piece reads home.
 */

export const Y = FACE_COLOR.D
export const W = FACE_COLOR.U

/** Each formula from each hold (some only), the top turned before it
 *  (and back after, `back`), each its kind. */
export const fromEachHold = (
  formulas: readonly (readonly Move[])[],
  kind: string,
  { holds = CUBE_HOLDS.holds, before = [0], back = false } = {},
): Gesture[] =>
  holds.flatMap((hold) =>
    before.flatMap((pre) =>
      formulas.map((f) => ({
        hold,
        kind,
        moves: [...topTurn(pre), ...f, ...(back ? topTurn(4 - pre) : [])],
      })),
    ),
  )

/** The 3x3's mechanism: what a search on some of its pieces turns on. */
export const MECHANISM = [3, 3, 3] as const

export const TOPS = [0, 1, 2, 3]
export const TOP_TURNS: Gesture[] = [1, 2, 3].map((t) => ({
  hold: 'F',
  moves: topTurn(t),
  kind: 'top',
}))

/** The shortest chain of gestures bringing the pieces it keeps to a goal. */
export const chainTo = (
  cube: Cube,
  gestures: readonly Gesture[],
  goal: (pieces: Cube) => boolean,
  keep: (c: Cubie) => boolean,
  depth: number,
) => gestureChain(cube, gestures, goal, { keep, depth, mechanism: MECHANISM, frame: CUBE_HOLDS })

// The frame: yellow down, but on its side for the last step.

/** The cube turned on its side (z), and back. */
export const ON_SIDE: Move = { face: 'F', amount: 1, whole: true }
const BACK_UP: Move = { face: 'F', amount: 3, whole: true }

const centerOf = (cube: Cube, color: string) =>
  cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === color)
export const onSide = (cube: Cube) =>
  centerOf(cube, Y)?.stickers[0]!.normal.join() === FACE_NORMAL.L.join()

/** The state as the first five steps read it: yellow down, the cube
 *  turned back up if the last step turned it on its side. */
export const upright = (cube: Cube) => (onSide(cube) ? applyMoves(cube, [BACK_UP]) : cube)

/** A target read upright. */
export const uprightTarget = (t: Target): Target => ({ ...t, placed: (c) => t.placed(upright(c)) })

/** A piece home: each of its stickers on the side of its color. */
export const home = (c: Cubie) =>
  c.stickers.every((s) => s.color === FACE_COLOR[faceOfNormal(s.normal)])

export const hasColor = (color: string) => (c: Cubie) => c.stickers.some((s) => s.color === color)
export const isCorner = (c: Cubie) => c.stickers.length === 3
export const isEdge = (c: Cubie) => c.stickers.length === 2
export const isYellow = hasColor(Y)
export const isWhite = hasColor(W)
export const whiteCorners = (cube: Cube) => cube.filter((c) => isWhite(c) && isCorner(c))
export const indicesOf = (cube: Cube, which: (c: Cubie) => boolean) =>
  cube.flatMap((c, i) => (which(c) ? [i] : []))

/** The yellow layer done (read upright). */
export const yellowLayer = (cube: Cube) => upright(cube).filter(isYellow).every(home)

/** The solved cube: where each piece goes. */
export const SOLVED = solvedCube('3')
