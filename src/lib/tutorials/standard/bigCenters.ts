import { FACE_COLOR } from '../../core/cube'
import { faceOfNormal, vecKey } from '../../core/geometry'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import type { Kept, Target } from '../../teach/kit'
import type { PieceStage } from '../../teach/stages'
import type { TutorialPick } from '../../teach/tutorial'

/**
 * The big cubes' centers stage (the 4x4's, the 5x5's): the centers that
 * move, one at a time, in their colors' faces' order (yellow, white, then
 * the belt), each placed as its solver places it (the cube declares how),
 * the faces built before kept. The right centers a face shows count only
 * once the faces before it are full (those it shows by chance do not
 * stay), so the progress never goes back.
 */

/** The faces in the order their centers are built. */
const ORDER: readonly Face[] = ['D', 'U', 'F', 'R', 'B', 'L']

export interface CenterSpec {
  /** Moving centers a face. */
  readonly full: number
  /** Whether a piece is a center that moves. */
  readonly isCenter: (cubie: Cubie) => boolean
  /** One more right center on the first face not full, the faces before
   *  kept: the solver's way (null: none found). */
  readonly next: (cube: Cube) => Move[] | null
  /** A picked center taken to a place of the face being built, keeping what
   *  `keep` says (null: none found, or another face). */
  readonly pick: (
    cube: Cube,
    piece: number,
    slot: Vec3,
    keep: (cube: Cube) => boolean,
  ) => Move[] | null
}

/** The centers stage, as stage 1 under `key`. */
export function centerStage(key: string, spec: CenterSpec): PieceStage {
  const { full, isCenter } = spec
  const faceOf = (cube: Cube, i: number) => faceOfNormal(cube[i]!.stickers[0]!.normal)
  const isRight = (cube: Cube, i: number) =>
    FACE_COLOR[faceOf(cube, i)] === cube[i]!.stickers[0]!.color
  /** A face's moving centers, right ones or not. */
  const centersOn = (cube: Cube, face: Face, right: boolean) =>
    cube.flatMap((c, i) =>
      isCenter(c) && faceOf(cube, i) === face && isRight(cube, i) === right ? [i] : [],
    )
  /** The right centers a face counts: none before the faces before it are
   *  full. */
  const counted = (cube: Cube, face: Face) =>
    ORDER.slice(0, ORDER.indexOf(face)).every((f) => centersOn(cube, f, true).length === full)
      ? centersOn(cube, face, true)
      : []

  /** The next center to place, as the solver places it (once per state):
   *  its moves, the center it brings, its face, and where it lands. */
  const NEXT = new WeakMap<Cube, { moves: Move[]; piece: number; slot: Vec3; face: Face } | null>()
  function nextCenter(cube: Cube) {
    if (NEXT.has(cube)) return NEXT.get(cube)!
    const face = ORDER.find((f) => centersOn(cube, f, true).length < full)
    const moves = face ? spec.next(cube) : null
    let found = null
    if (face && moves) {
      const after = applyMoves(cube, moves)
      const was = new Set(centersOn(cube, face, true))
      const piece = centersOn(after, face, true).find((i) => !was.has(i))
      if (piece !== undefined) found = { moves, piece, slot: after[piece]!.position, face }
    }
    NEXT.set(cube, found)
    return found
  }

  /** A center of a face's color away from it: one to bring when the
   *  solver finds none (no formula then). */
  const anyOf = (cube: Cube, face: Face) =>
    cube.findIndex(
      (c, i) =>
        isCenter(c) && c.stickers[0]!.color === FACE_COLOR[face] && faceOf(cube, i) !== face,
    )

  /** Read where the step began: per face, its first, second... right
   *  center (any of its color: they look the same), the next one the one
   *  the solver brings, where it lands (a turn of the face on the way may
   *  land it where a right one stood), the others to the face's other
   *  places. */
  function targets(begun: Cube): Target[] {
    const next = nextCenter(begun)
    return ORDER.flatMap((face) => {
      const right = counted(begun, face)
      const open = begun.flatMap((c, i) =>
        isCenter(c) && faceOf(begun, i) === face && !right.includes(i) ? [c.position] : [],
      )
      const slots =
        next?.face === face
          ? [next.slot, ...open.filter((p) => vecKey(p) !== vecKey(next.slot))]
          : open
      return Array.from({ length: full }, (_, n): Target => {
        const k = n + 1
        return {
          interchangeable: true,
          piece: (cube) =>
            k <= right.length ? counted(cube, face)[k - 1]! : (next?.piece ?? anyOf(cube, face)),
          slot: k <= right.length ? begun[right[k - 1]!]!.position : slots[k - right.length - 1]!,
          placed: (cube) => counted(cube, face).length >= k,
        }
      })
    })
  }

  /** The way to the pick's place: the solver's own if it is its pick, else
   *  one for that center there. */
  function formula(cube: Cube, pick: TutorialPick, kept: Kept): Move[] | null {
    const next = nextCenter(kept.begun)
    if (
      cube === kept.begun &&
      next &&
      next.piece === pick.piece &&
      vecKey(next.slot) === vecKey(pick.slot)
    ) {
      return next.moves
    }
    return spec.pick(cube, pick.piece, pick.slot, kept.targetsKept)
  }

  return { kind: 'pieces', key, stage: 1, targets, words: true, hold: () => 'F', formula }
}
