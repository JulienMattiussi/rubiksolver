import { FACE_COLOR, solvedCube } from '../../core/cube'
import { FACE_NORMAL, faceOfNormal } from '../../core/geometry'
import { invertMoves } from '../../core/moves'
import { colorsOf } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { centersHome, turnHome } from '../../methods/standard/recenter'
import { searchFormulas } from '../../solve/formulaSearch'
import { macroOf, placeChain, stickerPlaces } from '../../solve/placeTable'
import { once } from '../../solve/once'
import { CUBE_HOLDS, type Hold } from '../../core/hold'

/**
 * What the steps of the "cross then corners" tutorial share
 * (crossCorners.ts): each plays one formula, the cube held with any side
 * up and any in front (a way, `Way`), and, while the top's edges wait,
 * turns of the top. A step plays the shortest chain of its ways, searched
 * on the cube read with its centers home (`canonical`: the cube turned in
 * hand on the way stays so), on the stickers' places alone
 * (solve/placeTable.ts). Its first way is then played on the cube as it
 * stands: the cube turned first if another side has to come up, the
 * formula then held with the right side in front.
 */

const Y = FACE_COLOR.D
const W = FACE_COLOR.U

const MECHANISM = [3, 3, 3] as const
const SOLVED = solvedCube('3')

/** A formula played with a side up and one in front (named on the cube
 *  with its centers home), working on its side up or in front (`on`), or a
 *  turn of the top (`kind: 'top'`: the side opposite the cross, wherever
 *  it stands). */
export interface Way {
  readonly kind: string
  readonly up: Face
  readonly front: Face
  readonly formula: readonly Move[]
  readonly on: 'U' | 'F'
}

const whole = (face: Face, amount: 1 | 2 | 3): Move => ({ face, amount, whole: true })
const ROTATIONS = (['R', 'U', 'F'] as const).flatMap((f) =>
  ([1, 2, 3] as const).map((a) => [whole(f, a)]),
)
const centerAt = (cube: Cube, color: string): Face =>
  faceOfNormal(
    cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === color)!.stickers[0]!
      .normal,
  )

/** The cube turned whole until `up` is up and `front` in front. */
const holding = (up: Face, front: Face) =>
  searchFormulas(
    SOLVED,
    ROTATIONS,
    (c) => centerAt(c, FACE_COLOR[up]) === 'U' && centerAt(c, FACE_COLOR[front]) === 'F',
    { depth: 2 },
  )!

const SIDES_OF: Record<Face, readonly Face[]> = {
  U: ['F', 'R', 'B', 'L'],
  D: ['F', 'R', 'B', 'L'],
  F: ['U', 'R', 'D', 'L'],
  B: ['U', 'R', 'D', 'L'],
  R: ['U', 'F', 'D', 'B'],
  L: ['U', 'F', 'D', 'B'],
}

/** A formula from each way to hold the cube (`ups`: the sides it may have
 *  up, by default all), working on its side `on`. */
export const eachWay = (
  kind: string,
  formula: readonly Move[],
  {
    ups = ['U', 'D', 'F', 'B', 'R', 'L'],
    on = 'U',
  }: { ups?: readonly Face[]; on?: 'U' | 'F' } = {},
): Way[] => ups.flatMap((up) => SIDES_OF[up].map((front) => ({ kind, up, front, formula, on })))

/** The top (opposite the cross) turned each way. */
export const TOP_TURNS: Way[] = ([1, 2, 3] as const).map((amount) => ({
  kind: 'top',
  up: 'U',
  front: 'F',
  formula: [{ face: 'U', amount }],
  on: 'U',
}))

/** The cube read with its centers home: where the search works. */
export const canonical = (cube: Cube) =>
  centersHome(cube) ? cube : applyMoves(cube, turnHome(cube) ?? [])

// The search, on the stickers' places.

const PLACES = stickerPlaces(SOLVED, MECHANISM)
const HOME = new Map(
  SOLVED.filter((c) => c.stickers.length > 0).map((c) => [colorsOf(c), PLACES.placeOf(c)]),
)

/** A way's moves on the cube with its centers home: turned, played, turned
 *  back. */
const movesOf = (way: Way) => {
  const turn = holding(way.up, way.front)
  return [...turn, ...way.formula, ...invertMoves(turn)]
}
const tables = new Map<Way, Int16Array>()
const tableOf = (way: Way) => {
  let table = tables.get(way)
  if (!table) tables.set(way, (table = macroOf(PLACES.places, movesOf(way)).to))
  return table
}

/** Whether a way leaves some pieces (of the solved cube) where they are. */
export const keeps = (way: Way, which: (c: Cubie) => boolean) => {
  const table = tableOf(way)
  return SOLVED.filter(which).every((c) => {
    const at = PLACES.placeOf(c)
    return table[at] === at
  })
}

/** Some pieces read on their places: whether each is home, or in its cell
 *  (turned anyhow). */
export interface Placed {
  readonly pieces: readonly Cubie[]
  readonly home: (j: number) => boolean
  readonly inCell: (j: number) => boolean
}

const placedOf = (pieces: readonly Cubie[], places: readonly number[]): Placed => {
  const homes = pieces.map((c) => HOME.get(colorsOf(c))!)
  return {
    pieces,
    home: (j) => places[j] === homes[j],
    inCell: (j) => PLACES.places.slotOf(places[j]!) === PLACES.places.slotOf(homes[j]!),
  }
}

/** Pieces home, read on the cube (with its centers home). */
export const readPlaced = (cube: Cube, which: (c: Cubie) => boolean): Placed => {
  const pieces = canonical(cube).filter(which)
  return placedOf(pieces, pieces.map(PLACES.placeOf))
}

/** How many of some pieces a reading finds so. */
export const count = (
  placed: Placed,
  test: 'home' | 'inCell',
  which: (c: Cubie) => boolean = () => true,
) => placed.pieces.filter((c, j) => which(c) && placed[test](j)).length

/**
 * The fewest ways bringing the pieces it follows (`track`) to a goal, read
 * on their places; `cells`: the goal reads their cells only (not how they
 * are turned), which keeps the search small; `through`: what the states on
 * the way, and the one reached, must keep. Between chains as short, the one whose ways come
 * first in the list. Null if none does within the depth.
 */
export function wayChain(
  cube: Cube,
  ways: readonly Way[],
  track: (c: Cubie) => boolean,
  goal: (placed: Placed) => boolean,
  {
    cells = false,
    depth = Infinity,
    through,
  }: { cells?: boolean; depth?: number; through?: (placed: Placed) => boolean } = {},
): Way[] | null {
  const pieces = canonical(cube).filter(track)
  const chain = placeChain(
    pieces.map(PLACES.placeOf),
    ways.map(tableOf),
    // The goal met keeping what the way keeps too.
    (places) => {
      const placed = placedOf(pieces, places)
      return (!through || through(placed)) && goal(placed)
    },
    {
      depth,
      ...(through && { through: (places) => through(placedOf(pieces, places)) }),
      ...(cells && { key: (places) => places.map(PLACES.places.slotOf).join(';') }),
    },
  )
  return chain && chain.map((i) => ways[i]!)
}

/**
 * How near some pieces (`track`) stand to all of them home, by ways, each
 * taken only where `edge` lets it (from a reading of theirs to the next):
 * a table of every state they reach, built once from home backward. Read
 * on a cube: the way bringing it nearest home (`turning`: among those that
 * move that piece, by its colors), null if none.
 */
export function wayGuide(
  ways: readonly Way[],
  track: (c: Cubie) => boolean,
  edge: (from: Placed, to: Placed) => boolean,
) {
  const pieces = SOLVED.filter(track)
  const homes = pieces.map(PLACES.placeOf)
  const distance = once(() => {
    const backward = ways.map((way) => {
      const to = tableOf(way)
      const from = new Int16Array(to.length)
      to.forEach((j, i) => (from[j] = i))
      return from
    })
    const seen = new Map([[homes.join(), 0]])
    let frontier = [homes]
    for (let d = 1; frontier.length; d++) {
      const next: number[][] = []
      for (const state of frontier) {
        for (const from of backward) {
          const before = state.map((p) => from[p]!)
          const key = before.join()
          if (seen.has(key) || !edge(placedOf(pieces, before), placedOf(pieces, state))) continue
          seen.set(key, d)
          next.push(before)
        }
      }
      frontier = next
    }
    return seen
  })
  return (cube: Cube, turning?: string): Way | null => {
    const held = canonical(cube)
    const now = pieces.map((p) => PLACES.placeOf(held.find((c) => colorsOf(c) === colorsOf(p))!))
    const j = turning === undefined ? -1 : pieces.findIndex((p) => colorsOf(p) === turning)
    let best: Way | null = null
    let nearest = Infinity
    for (const way of ways) {
      const to = tableOf(way)
      const after = now.map((p) => to[p]!)
      const d = distance().get(after.join())
      if (d === undefined || d >= nearest || (j >= 0 && after[j] === now[j])) continue
      if (!edge(placedOf(pieces, now), placedOf(pieces, after))) continue
      best = way
      nearest = d
    }
    return best
  }
}

// A way played on the cube as it stands.

/** The turn of the whole cube bringing a side up (none when it is). */
const UP_TURN: Record<Face, Move[]> = {
  U: [],
  F: [whole('R', 1)],
  B: [whole('R', 3)],
  D: [whole('R', 2)],
  L: [whole('F', 1)],
  R: [whole('F', 3)],
}

/** A way on the cube as it stands: the cube turned first if another side
 *  has to come up, then the formula held with the right side in front
 *  (read in that hold); the top's turn named where it stands. Its side
 *  (`side`: the one it works on, once so held). */
export interface Played {
  readonly kind: string
  readonly hold: Hold
  readonly moves: Move[]
  readonly side: Vec3
}

/** A turn of the top, named where that side stands on a cube. */
const topTurn = (cube: Cube, way: Way): Move[] => {
  const face = centerAt(cube, FACE_COLOR[way.up])
  return way.formula.map((m) => ({ ...m, face }))
}

/** A way played (`before`: a turn of the top just ahead of it, in the same
 *  step, once the cube is turned: its kind then `top` + the way's). */
export function playedOf(cube: Cube, way: Way, before?: Way): Played {
  if (way.kind === 'top') {
    const moves = topTurn(cube, way)
    return { kind: 'top', hold: 'F', moves, side: FACE_NORMAL[moves[0]!.face] }
  }
  const turn = UP_TURN[centerAt(cube, FACE_COLOR[way.up])]
  const turned = applyMoves(cube, turn)
  const hold = centerAt(turned, FACE_COLOR[way.front])
  const top = before ? topTurn(turned, before) : []
  return {
    kind: before ? `top${way.kind[0]!.toUpperCase()}${way.kind.slice(1)}` : way.kind,
    hold,
    moves: [...[...turn, ...top].map((m) => CUBE_HOLDS.inHold(hold, m) as Move), ...way.formula],
    side: FACE_NORMAL[way.on === 'U' ? 'U' : hold],
  }
}

/** The first way of a stage's chain, played on the cube as it stands (null:
 *  none): a turn of the top with the way after it, if any (bringing a
 *  piece round is no step of its own). */
export const leadOf = (chainOf: (cube: Cube) => Way[] | null) => (cube: Cube) => {
  const [way, next] = chainOf(cube) ?? []
  if (!way) return null
  return way.kind === 'top' && next ? playedOf(cube, next, way) : playedOf(cube, way)
}

/** The figures of a stage played by chains of ways: a figure for each kind
 *  of its first one (`top` among them, and a way after a turn of the top:
 *  `topSwap`...). */
export const wayFigures = (lead: (cube: Cube) => Played | null, keys: Record<string, string>) =>
  Object.entries(keys).map(([kind, key]) => ({
    key,
    match: (cube: Cube) => {
      const first = lead(cube)
      return first?.kind === kind ? { hold: first.hold, moves: first.moves } : null
    },
  }))

export const isEdge = (c: Cubie) => c.stickers.length === 2
export const isCorner = (c: Cubie) => c.stickers.length === 3
const hasColor = (color: string) => (c: Cubie) => c.stickers.some((s) => s.color === color)
export const isYellow = hasColor(Y)
export const isWhite = hasColor(W)
export const isMiddleEdge = (c: Cubie) => isEdge(c) && !isYellow(c) && !isWhite(c)
