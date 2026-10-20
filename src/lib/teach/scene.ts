import { applyMoves } from '../core/turn'
import {
  isFaceMove,
  type Color,
  type Cube,
  type Cubie,
  type Sticker,
  type Turn,
  type Vec3,
} from '../core/types'
import type { TutorialPick, TutorialStep } from './tutorial'

/**
 * How a tutorial's formula reads on the puzzle: each piece's tone, the
 * arrows, a piece's colors and who stands in its way. Pure: the scene
 * (three/core/CubeView) only draws them.
 */

/** What a formula does to a piece: aimed at (`target`), standing where
 *  that one goes (`slot`), kept in place (`placed`), worked on by a figure
 *  step (`subject`: its colors kept, an arrow), moved though not placed yet
 *  (`moved`: hatched), left be. */
export type Tone = 'target' | 'slot' | 'placed' | 'subject' | 'moved' | 'still'

/** Each piece's tone (by index) under a formula. */
/** Whether a formula only turns the whole puzzle (x, y, z): held another
 *  way, no piece moves on it, none stands in the way. */
export const turnsWhole = (moves: readonly Turn[]) =>
  moves.length > 0 && moves.every((m) => isFaceMove(m) && m.whole)

export function tonesOf(
  cube: Cube,
  moves: readonly Turn[],
  pick: TutorialPick | null,
  placed: readonly number[],
  focus: readonly number[] = [],
  subjects: readonly number[] = [],
): Tone[] {
  if (turnsWhole(moves)) return cube.map((_, i) => (pick && i === pick.piece ? 'target' : 'still'))
  const after = applyMoves(cube, moves)
  return cube.map((c, i) => {
    if ((pick && i === pick.piece) || focus.includes(i)) return 'target'
    if (pick && c.position.join() === pick.slot.join()) return 'slot'
    if (placed.includes(i)) return 'placed'
    const a = after[i]!
    const moved =
      a.position.join() !== c.position.join() ||
      a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
    return moved ? (subjects.includes(i) ? 'subject' : 'moved') : 'still'
  })
}

/** An arrow: the piece it is for, from a face (its position and outward
 *  normal) to the face it lands on. */
export interface Arrow {
  readonly piece: number
  readonly from: Vec3
  readonly fromNormal: Vec3
  readonly to: Vec3
  readonly toNormal: Vec3
}

/** Where a formula takes a piece's marker sticker (its color, `marker`;
 *  the piece's first sticker if it has none): the face it stands on before
 *  and the one after. */
export function markerPath(
  cube: Cube,
  moves: readonly Turn[],
  piece: number,
  marker?: Color,
): Arrow {
  const before = cube[piece]!
  const after = applyMoves(cube, moves)[piece]!
  const k = Math.max(
    0,
    before.stickers.findIndex((s) => s.color === marker),
  )
  return {
    piece,
    from: before.position,
    fromNormal: before.stickers[k]!.normal,
    to: after.position,
    toNormal: after.stickers.find((s) => s.color === before.stickers[k]!.color)!.normal,
  }
}

/** A formula's arrows: the pick's (its marker sticker's way), or, with no
 *  pick, one for each subject it moves, on the step's side: its marker
 *  sticker's way if the step has one, when it comes to that side (the
 *  white brought up), else from that side's face to the same where it
 *  lands. */
export function arrowsOf(
  cube: Cube,
  moves: readonly Turn[],
  step: TutorialStep,
  pick: TutorialPick | null,
): Arrow[] {
  if (moves.length === 0) return []
  if (pick) return [markerPath(cube, moves, pick.piece, step.marker)]
  const side = step.side
  if (!side) return []
  const after = applyMoves(cube, moves)
  return (step.subjects ?? []).flatMap((i) => {
    if (cube[i]!.position.join() === after[i]!.position.join()) return []
    if (step.marker) {
      // Only the marker stickers brought to that side: the figure next.
      const path = markerPath(cube, moves, i, step.marker)
      return path.toNormal.join() === side.join() ? [path] : []
    }
    return [
      {
        piece: i,
        from: cube[i]!.position,
        fromNormal: side,
        to: after[i]!.position,
        toNormal: side,
      },
    ]
  })
}

/** The subjects a formula moves with an arrow (the others it moves, the
 *  white taken off the top, are hatched as any piece moved). */
export const arrowedSubjects = (cube: Cube, moves: readonly Turn[], step: TutorialStep) =>
  arrowsOf(cube, moves, step, null).map((a) => a.piece)

/** The subjects whose marker sticker a formula leaves on the step's side
 *  (the corners white up once it is played), by index. */
export function markedOn(cube: Cube, moves: readonly Turn[], step: TutorialStep): number[] {
  const { side, marker, subjects = [] } = step
  if (!side || !marker) return []
  const after = applyMoves(cube, moves)
  return subjects.filter((i) =>
    after[i]!.stickers.some((s) => s.color === marker && s.normal.join() === side.join()),
  )
}

/** A piece's colors, the marker's first (the yellow edge's: yellow-green). */
export function pieceColors(
  cube: Cube,
  index: number,
  marker?: Color,
  outside: (cubie: Cubie) => readonly Sticker[] = (c) => c.stickers,
): Color[] {
  return [...outside(cube[index]!)]
    .sort((a, b) => Number(b.color === marker) - Number(a.color === marker))
    .map((s) => s.color)
}

/** The piece standing where a pick goes (null: none, the pick's own, or
 *  the formula only turning the whole puzzle). */
export function occupantOf(
  cube: Cube,
  pick: TutorialPick,
  moves: readonly Turn[] = [],
): number | null {
  if (turnsWhole(moves)) return null
  const at = cube.findIndex((c, i) => i !== pick.piece && c.position.join() === pick.slot.join())
  return at < 0 ? null : at
}
