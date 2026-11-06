import { FACE_COLOR, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, mapPiece } from '../../core/geometry'
import { isMark } from '../../core/types'
import type { Cube, Cubie } from '../../core/types'
import { permutationIsOdd } from '../../solve/permutation'
import { colorsOf, lensOf, linesOff, withLines } from './impossible'
import type { MarksRefusal } from '../../editor/entry'

/**
 * How the Rubik's Impossible's entry settles what its colors cannot tell
 * (lib/editor/modes/pairs.ts paints its pieces from what their tiles
 * show): two pieces may show the same colors at a place, and only the
 * angle each tile turns at tells them apart, which the user cannot see.
 * The blue-orange edge shows blue and orange on both its tiles, either
 * way round; the orange-green and red-blue edges each show blue/orange on
 * one tile and green/red on the other, so either may be the other. Of the
 * pieces showing what was entered, one choice only is reachable (a flip
 * of one edge, or a swap of two, is not), the one kept.
 */

/** What a piece shows, tile by tile: each tile's colors, in any order. */
const showsKey = (c: Cubie): string => {
  const lenses = lensOf(c)
  return c.stickers
    .filter((s) => !isMark(s))
    .map((s, i) => `${s.normal.join()}:${[s.color, lenses[i]!.secondary ?? ''].sort().join('')}`)
    .sort()
    .join(' ')
}

/** The solved pieces (centers aside), made when first read (the solved
 *  3x3 comes from cube.ts, which loads after the models). */
let solvedPieces: Cubie[] | undefined
const pieces = () =>
  (solvedPieces ??= withLines(solvedCube('3')).filter((c) => colorsOf(c).length > 1))

/** The pieces that would show at a place what the one there shows (itself
 *  first): every solved piece, turned every way that brings it there. */
function alike(cubie: Cubie): Cubie[] {
  const at = cubie.position.join()
  const key = showsKey(cubie)
  const found = new Map<string, Cubie>([[cubie.stickers.map((s) => s.color).join(), cubie]])
  for (const home of pieces()) {
    if (home.stickers.length !== cubie.stickers.length) continue
    for (const rotate of AXIS_ROTATIONS) {
      const piece = mapPiece(rotate)(home)
      if (piece.position.join() !== at) continue
      // Its stickers in the order of the one there.
      const turned: Cubie = {
        position: cubie.position,
        stickers: cubie.stickers.map((s) =>
          piece.stickers.find((p) => p.normal.join() === s.normal.join())!,
        ),
      }
      if (showsKey(turned) === key) found.set(turned.stickers.map((s) => s.color).join(), turned)
    }
  }
  return [...found.values()]
}

/** An edge's flip, as the 3x3 counts it: its white or yellow sticker (else
 *  its green or blue one) off the side its place counts. */
function flipped(edge: Cubie): boolean {
  const ref =
    edge.stickers.find((s) => s.color === FACE_COLOR.U || s.color === FACE_COLOR.D) ??
    edge.stickers.find((s) => s.color === FACE_COLOR.F || s.color === FACE_COLOR.B)!
  const axis = edge.position[1] !== 0 ? 1 : 2
  return ref.normal[axis] === 0
}

/** Whether the pieces of this many stickers stand in an odd permutation. */
function odd(cube: Cube, size: number): boolean {
  const homes = new Map(pieces().map((c) => [colorsOf(c), c.position.join()]))
  const of = cube.filter((c) => c.stickers.length === size && colorsOf(c).length === size)
  return permutationIsOdd(new Map(of.map((c) => [c.position.join(), homes.get(colorsOf(c))!])))
}

/** Whether a 3x3 could stand so, as far as its edges go: each piece
 *  once, an even number of edges flipped, as many swaps as its corners. */
function edgesFit(cube: Cube): boolean {
  const edges = cube.filter((c) => c.stickers.length === 2)
  if (new Set(edges.map(colorsOf)).size !== edges.length) return false
  if (edges.filter(flipped).length % 2) return false
  return odd(cube, 2) === odd(cube, 3)
}

/** The state entered, its look-alike pieces chosen so that it can be
 *  reached (as entered, when none can). */
export function settled(cube: Cube): Cube {
  const choices = cube.map((c, i) => ({ i, pieces: alike(c) })).filter((c) => c.pieces.length > 1)
  let tries: Cube[] = [cube]
  for (const { i, pieces } of choices)
    tries = tries.flatMap((t) => pieces.map((p) => t.map((c, j) => (j === i ? p : c))))
  return tries.find(edgesFit) ?? cube
}

/** Its centers' lines refused when they cannot go with its corners: each
 *  quarter turn of a face turns its center's line and swaps its corners
 *  an odd number of times, so as many lines lie across as its corners
 *  are swapped, two by two. The lines are entered by a click each, where
 *  a mistake is easily made: told apart from the rest. */
export const linesRefused = (cube: Cube): MarksRefusal | null =>
  linesOff(cube).length % 2 === (odd(cube, 3) ? 1 : 0) ? null : 'lines'
