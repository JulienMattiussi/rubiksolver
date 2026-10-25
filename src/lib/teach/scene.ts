import { cubeShape, turnDims } from '../core/cube'
import { invertMoves } from '../core/moves'
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

/** A formula's first turns of the whole puzzle (`lead`: how to hold it for
 *  the rest), the puzzle so held (`held`), and the rest. */
export function heldFor(cube: Cube, moves: readonly Turn[]) {
  const first = moves.findIndex((m) => !(isFaceMove(m) && m.whole))
  const lead = first < 0 ? moves : moves.slice(0, first)
  return {
    lead,
    held: lead.length ? applyMoves(cube, lead) : cube,
    rest: moves.slice(lead.length),
  }
}

export function tonesOf(
  cube: Cube,
  moves: readonly Turn[],
  pick: TutorialPick | null,
  placed: readonly number[],
  focus: readonly number[] = [],
  subjects: readonly number[] = [],
): Tone[] {
  if (turnsWhole(moves)) return cube.map((_, i) => (pick && i === pick.piece ? 'target' : 'still'))
  // Moved by the formula held as its first turns of the whole puzzle say.
  const { held, rest } = heldFor(cube, moves)
  const after = applyMoves(held, rest)
  return cube.map((c, i) => {
    if ((pick && i === pick.piece) || focus.includes(i)) return 'target'
    if (pick && c.position.join() === pick.slot.join()) return 'slot'
    if (placed.includes(i)) return 'placed'
    const [a, h] = [after[i]!, held[i]!]
    const moved =
      a.position.join() !== h.position.join() ||
      a.stickers.some((s, k) => s.normal.join() !== h.stickers[k]!.normal.join())
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
 *  pick, one for each subject it moves or turns in place: its marker
 *  sticker's way if the step has one, else, on the step's side, from that
 *  side's face (or the sticker brought to it) to the same where it lands,
 *  else its first sticker's way. A formula starting by turning the whole
 *  puzzle: its arrows read so held, drawn on the puzzle as it stands. */
export function arrowsOf(
  cube: Cube,
  moves: readonly Turn[],
  step: TutorialStep,
  pick: TutorialPick | null,
): Arrow[] {
  if (moves.length === 0 || turnsWhole(moves)) return []
  const { lead, held, rest } = heldFor(cube, moves)
  if (lead.length) {
    const back = invertMoves(lead)
    const dims = turnDims(cubeShape(cube))
    const unturned = (position: Vec3, normal: Vec3) => {
      const [probe] = applyMoves([{ position, stickers: [{ normal, color: 'W' }] }], back, dims)
      return { position: probe!.position, normal: probe!.stickers[0]!.normal }
    }
    return arrowsOf(held, rest, step, pick).map((a) => {
      const from = unturned(a.from, a.fromNormal)
      const to = unturned(a.to, a.toNormal)
      return {
        piece: a.piece,
        from: from.position,
        fromNormal: from.normal,
        to: to.position,
        toNormal: to.normal,
      }
    })
  }
  if (pick) return [markerPath(cube, moves, pick.piece, step.marker)]
  const { side, marker } = step
  const after = applyMoves(cube, moves)
  const same = (a: readonly number[], b: readonly number[]) => a.join() === b.join()
  return (step.subjects ?? []).flatMap((i): Arrow[] => {
    const [c, a] = [cube[i]!, after[i]!]
    const arrow = (fromNormal: Vec3, toNormal: Vec3): Arrow[] =>
      // Turned round that face itself (no way to show it): none.
      same(c.position, a.position) && same(fromNormal, toNormal)
        ? []
        : [{ piece: i, from: c.position, fromNormal, to: a.position, toNormal }]
    const moved =
      !same(c.position, a.position) ||
      c.stickers.some((s, k) => !same(s.normal, a.stickers[k]!.normal))
    if (!moved) return []
    // Its marker sticker's way (the white brought up), or, with no side, its
    // first sticker's.
    if (marker || !side) {
      const path = markerPath(cube, moves, i, marker)
      return arrow(path.fromNormal, path.toNormal)
    }
    // On the side: from that face to the same where it lands; a piece not on
    // it yet (brought there, or turned in place), from the sticker the
    // formula brings to it.
    const on = c.stickers.some((s) => same(s.normal, side))
    if (on && !same(c.position, a.position)) return arrow(side, side)
    const k = a.stickers.findIndex((s) => same(s.normal, side))
    if (k >= 0) return arrow(c.stickers[k]!.normal, side)
    const path = markerPath(cube, moves, i)
    return arrow(path.fromNormal, path.toNormal)
  })
}

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
