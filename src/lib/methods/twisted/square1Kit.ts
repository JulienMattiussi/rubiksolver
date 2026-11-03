import { solvedCube } from '../../core/cube'
import { allTurnsOf, type MoveSet } from '../../core/moveSet'
import { NOTATION_FR } from '../../core/notation'
import type { Cube, Cubie, SectorMove, SectorSteps } from '../../core/types'
import {
  applySectorMove,
  parseSectorMoves,
  sectorFaced,
  sectorPlace,
} from '../../puzzles/shared/sectors'
import { square1Turns } from '../../puzzles/twisted/square1'
import { once } from '../../solve/once'

/**
 * What the Square-1's two methods share (square1CornersFirst.ts after
 * fan2cube, square1FaceFirst.ts after francocube): its turns, its formulas
 * read in fan2cube's notation (the bottom turning clockwise seen from below,
 * shared/sectors.ts), where a piece stands against its home, and the first
 * step of both, back to a cube.
 */

/** A formula as fan2cube writes it (`-B/3/3/6/B`). */
export const formula = (text: string): SectorMove[] => parseSectorMoves(text, NOTATION_FR)

/** A formula as francocube writes it, in pairs: `(x, y)` the top turned x,
 *  the bottom y, `/` the slash. */
export const pairsFormula = (text: string): SectorMove[] =>
  formula(
    text.replace(/\((-?\d+),\s*(-?\d+)\)/g, (_, x: string, y: string) =>
      [Number(x) ? x : '', Number(y) ? `${y}B` : ''].filter(Boolean).join('+'),
    ),
  )

const turn = (layer: 'U' | 'D', steps: number): SectorMove[] =>
  steps % 12 ? [{ layer, steps: (((steps % 12) + 12) % 12) as SectorSteps }] : []

/** Every turn it has: the step sets of its methods. */
export const EVERY_TURN: MoveSet = allTurnsOf('square1')

/** The layers turned by quarters, which keep a cube a cube. */
export const QUARTERS: MoveSet = {
  generators: [...turn('U', 3), ...turn('D', 3)],
  turns: [3, 6, 9].flatMap((k) => [...turn('U', k), ...turn('D', k)]),
}

/** fan2cube's two insertions (squareone2), which both methods place the
 *  bottom with: a top corner down, (HDA)->(BAD), and a top edge down,
 *  (HD)->(BD); a cube stays a cube. */
export const INSERT_CORNER = formula('-B/3/3/6/B')
export const INSERT_EDGE = formula('1/-3B/-1-4B/1+B/3B/3B/-1')

/** The pieces' homes, by their colors. */
const HOME = once(
  () =>
    new Map(
      solvedCube('square1').flatMap((c) => {
        const place = sectorPlace(c.position)
        return place ? [[colorsKey(c), place] as const] : []
      }),
    ),
)

const colorsKey = (c: Cubie): string =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join('')

export const isCorner = (c: Cubie): boolean => sectorPlace(c.position)?.wide ?? false
export const isEdge = (c: Cubie): boolean => sectorPlace(c.position)?.wide === false
const isLayerPiece = (c: Cubie): boolean => sectorPlace(c.position) !== undefined

/** Whether a piece belongs to the top layer (its home's). */
const fromTop = (c: Cubie): boolean => HOME().get(colorsKey(c))!.z > 0

/** How far a piece stands from home, in its layer's own turns (a top
 *  piece k twelfths on, a bottom one k twelfths back), or null when it is
 *  out of its layer. */
export function offsetOf(c: Cubie): number | null {
  const place = sectorPlace(c.position)
  const home = HOME().get(colorsKey(c))
  if (!place || !home || place.z !== home.z) return null
  const k = place.m - home.m
  return (((place.z > 0 ? k : -k) % 12) + 12) % 12
}

/** Whether these pieces stand in their layer, all as far from home: placed,
 *  the layer turning them home together. */
export function placedTogether(pieces: readonly Cubie[]): boolean {
  const offsets = new Set(pieces.map(offsetOf))
  return offsets.size <= 1 && !offsets.has(null)
}

/** The layer pieces whose home is this layer, of this kind. */
export const piecesOf = (
  cube: readonly Cubie[],
  top: boolean,
  kind: (c: Cubie) => boolean,
): Cubie[] => cube.filter((c) => isLayerPiece(c) && kind(c) && fromTop(c) === top)

/** Whether it is a cube, ready to slash: every corner on a boundary that
 *  sides it as solved (1, 4, 7, 10) and, when asked, the middle square,
 *  not flipped. */
export function isCube(cube: readonly Cubie[], middle = true): boolean {
  return cube.every((c) => {
    const place = sectorPlace(c.position)
    if (place) return !place.wide || place.m % 3 === 1
    return !middle || c.stickers.every((s) => sectorFaced(s.normal)! % 3 === 2)
  })
}

/** A layer's outline: each sector's piece, an edge's or a corner's first or
 *  second twelfth, from sector 0 on. */
function outline(cube: Cube, z: number): string {
  const cells = Array<string>(12).fill('e')
  for (const c of cube) {
    const place = sectorPlace(c.position)
    if (!place?.wide || place.z !== z) continue
    cells[(place.m + 11) % 12] = 'a'
    cells[place.m] = 'b'
  }
  return cells.join('')
}

/** The shape, its layers' outlines read from wherever they are turned, the
 *  middle flipped or not. */
function shapeKey(cube: Cube, middle: boolean): string {
  const turned = (s: string) =>
    Array.from({ length: 12 }, (_, r) => s.slice(r) + s.slice(0, r)).sort()[0]!
  const flipped = cube.some((c) => !sectorPlace(c.position) && !isCube([c]))
  return `${turned(outline(cube, 1))}|${turned(outline(cube, -1))}${middle ? `|${flipped}` : ''}`
}

const play = (cube: Cube, moves: readonly SectorMove[]): Cube => moves.reduce(applySectorMove, cube)

/**
 * Back to a cube: the fewest slashes, each after the layers' turns that let
 * it go, through its shapes (a hundred or so, their layers read from
 * wherever turned), then the layers turned so its corners side it as
 * solved. `middle`: the middle square too (fan2cube), or left for later
 * (francocube's last step).
 */
export function toCube(cube: Cube, middle: boolean): SectorMove[] {
  const goal = (state: Cube) => shapeKey(state, middle) === shapeKey(solvedCube('square1'), middle)
  let frontier: { state: Cube; moves: SectorMove[] }[] = [{ state: cube, moves: [] }]
  const seen = new Set([shapeKey(cube, middle)])
  while (frontier.length && !frontier.some((n) => goal(n.state))) {
    const next: typeof frontier = []
    for (const { state, moves } of frontier) {
      for (let u = 0; u < 12; u++) {
        for (let d = 0; d < 12; d++) {
          const setup = [...turn('U', u), ...turn('D', d)]
          const turned = play(state, setup)
          if (!square1Turns(turned, { flip: true })) continue
          const slashed = applySectorMove(turned, { flip: true })
          const key = shapeKey(slashed, middle)
          if (seen.has(key)) continue
          seen.add(key)
          next.push({ state: slashed, moves: [...moves, ...setup, { flip: true }] })
        }
      }
    }
    frontier = next
  }
  const found = frontier.find((n) => goal(n.state))
  if (!found) throw new Error('square1: no way back to a cube')
  // Its layers turned so that its corners side it as solved.
  for (let u = 0; u < 3; u++) {
    for (let d = 0; d < 3; d++) {
      const align = [...turn('U', u), ...turn('D', d)]
      if (isCube(play(found.state, align), middle)) return [...found.moves, ...align]
    }
  }
  throw new Error('square1: a cube out of line')
}

/** The pieces a step of either method tracks: the corners always (they
 *  say when the slash jams), the middle when it matters. */
export const trackedHomes = (keep: (c: Cubie) => boolean): Cube =>
  solvedCube('square1').filter((c) => isCorner(c) || keep(c))

/** Whether a turn goes, read on tracked pieces that hold every corner. */
export const goesOnCorners = (pieces: Cube, move: SectorMove | { flip: true }): boolean =>
  square1Turns(pieces, move)
