import { cubeOrientations, solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { colorsOf, sameAt } from '../../core/pieces'
import type { CubeShape } from '../../core/shapes'
import type { Color, Cube, Cubie, Move, Sticker, Vec3 } from '../../core/types'
import { searchFormulas } from '../../solve/formulaSearch'
import type { Kept, Target } from '../../teach/kit'
import type { PieceStage } from '../../teach/stages'
import type { Term, TutorialPick } from '../../teach/tutorial'

/**
 * What the flat puzzles' tutorials share (the Floppy's, the 1x2x3's): one
 * layer thick, they only take half turns, and some of their pieces never
 * leave their place (the Floppy's edges, the 1x2x3's middles), which say
 * how the puzzle stands. Their corners are placed one at a time, the
 * shortest way in half turns keeping the corners placed and that frame.
 */

/** A piece by where it stands: off the middle along both axes of the
 *  plate a corner, along one an edge, along none the center. */
export function flatPieceKind(cubie: Cubie): string {
  const off = cubie.position.filter((v) => v !== 0).length
  return off === 2 ? 'corner' : off === 1 ? 'edge' : 'center'
}

/** The stickers naming a piece: those on its rim, the plate's two big
 *  faces set aside (every corner wears both; they name none). Along an
 *  axis it stands in the middle of, a piece shows a big face. */
export const flatOutside = (cubie: Cubie): readonly Sticker[] =>
  cubie.stickers.filter((s) => s.normal.every((n, a) => n === 0 || cubie.position[a] !== 0))

/** The solved state the puzzle stands toward: the solved orientation
 *  showing what `fixed` reads of the pieces that never move. */
export function frameOf(shape: CubeShape, fixed: (cube: Cube) => string) {
  const orientations = cubeOrientations(solvedCube(shape))
  return (cube: Cube): Cube =>
    orientations.find((o) => fixed(o) === fixed(cube)) ?? orientations[0]!
}

/** Each side's color, as the frame has it (what to hold in front). */
export const frameColor =
  (frame: (cube: Cube) => Cube) =>
  (cube: Cube, normal: Vec3): Color | null =>
    frame(cube)
      .flatMap((c) => c.stickers)
      .find((s) => sameAt(s.normal, normal))?.color ?? null

/** Whether a piece stands where the frame has it, showing its stickers so. */
export const showsFrame = (cube: Cube, frame: Cube, slot: Vec3) => {
  const at = cube.find((c) => sameAt(c.position, slot))
  const want = frame.find((c) => sameAt(c.position, slot))
  return (
    !!at &&
    !!want &&
    want.stickers.every((s) =>
      at.stickers.some((t) => t.color === s.color && sameAt(t.normal, s.normal)),
    )
  )
}

/** The corners' stage (`key`): each corner to its place in the frame,
 *  one at a time (in `slots` order), the shortest way in half turns. */
export function cornerStage(
  key: string,
  shape: CubeShape,
  frame: (cube: Cube) => Cube,
  slots: readonly Vec3[],
): PieceStage {
  const turns = (allTurnsOf(shape).turns as Move[]).map((t) => [t])
  /** The frame kept: what tells it unchanged. */
  const keepsFrame = (begun: Cube) => {
    const was = frame(begun)
    return (cube: Cube) => frame(cube) === was
  }
  const target = (slot: Vec3): Target => ({
    piece: (cube) => {
      const want = colorsOf(frame(cube).find((c) => sameAt(c.position, slot))!)
      return cube.findIndex((c) => colorsOf(c) === want)
    },
    slot,
    placed: (cube) => showsFrame(cube, frame(cube), slot),
  })
  const formula = (cube: Cube, pick: TutorialPick, kept: Kept): Move[] | null => {
    const framed = keepsFrame(kept.begun)
    const goal = (c: Cube) =>
      framed(c) &&
      kept.targetsKept(c) &&
      sameAt(c[pick.piece]!.position, pick.slot) &&
      (colorsOf(c[pick.piece]!) !==
        colorsOf(frame(c).find((p) => sameAt(p.position, pick.slot))!) ||
        showsFrame(c, frame(c), pick.slot))
    return searchFormulas(cube, turns, goal, { depth: 8 })
  }
  return {
    kind: 'pieces',
    key,
    stage: 1,
    targets: slots.map(target),
    words: true,
    hold: () => 'F',
    formula,
  }
}

const withKind = (kind: string) => (cube: Cube) =>
  cube.flatMap((c, i) => (c.stickers.length > 0 && flatPieceKind(c) === kind ? [i] : []))

const FRONT_RIGHT_TOP: Vec3 = [1, 1, 1]
const FRONT_RIGHT: Vec3 = [1, 0, 1]

export const FLAT_CORNER: Term = {
  key: 'termFlatCorner',
  pieces: withKind('corner'),
  from: () => FRONT_RIGHT_TOP,
}
export const FLAT_EDGE: Term = {
  key: 'termFlatEdge',
  pieces: withKind('edge'),
  from: () => FRONT_RIGHT_TOP,
}

/** A half turn, the only one these puzzles take: the right side's. */
const HALF: Move = { face: 'R', amount: 2 }
export const HALF_TURN: Term = {
  key: 'termHalfTurn',
  pieces: (cube) => cube.flatMap((c, i) => (c.position[0] > 0 ? [i] : [])),
  from: () => FRONT_RIGHT,
  demo: HALF,
}
