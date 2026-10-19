import { cubeShape, FACE_COLOR } from '../../core/cube'
import { isMark } from '../../core/types'
import { invertMoves, sameLayer } from '../../core/moves'
import { allTurnsOf, type MoveSet } from '../../core/moveSet'
import { solvePieces } from '../../solve/pieceSearch'
import { colorsOf } from '../../core/pieces'
import type { Cube, Cubie, Move, Turn, Vec3 } from '../../core/types'
import { cutsNoBlock } from '../../puzzles/bandaged/bonds'
import { homeOf, pieceInSlot, piecesHome } from '../standard/pieces3'
import { found, searchFormulas } from '../../solve/formulaSearch'

/**
 * Bricks of the bandaged puzzles' methods (lib/puzzles/bandaged): their
 * steps are fan2cube.fr's, each finding its pieces' turns among the page's
 * formulas (and turns of the faces that go), so a step's goal is reached
 * with the formulas a reader would use.
 *
 * A formula whose blocks end where they started is always playable from
 * where it was found playable: a bandaged puzzle's turns are jammed by its
 * blocks only, never by its colors.
 */

/** Each formula, and the way back (its inverse). */
export const bothWays = (formulas: readonly (readonly Move[])[]): Move[][] =>
  formulas.flatMap((f) => [[...f], invertMoves(f)])

/** The formulas as a search's generators beside the turns `moves` allows:
 *  each without its last turns of those layers, which the search adds
 *  itself (it never turns a layer just turned, so H could not follow a
 *  formula ending with H). */
const beside = (moves: MoveSet, formulas: readonly (readonly Move[])[]): Move[][] =>
  formulas.map((f) => {
    let end = f.length
    while (end > 0 && moves.turns.some((t) => sameLayer(t, f[end - 1]!))) end--
    return f.slice(0, end)
  })

/** A phase bringing the named pieces home (the earlier ones listed again,
 *  so nothing goes back), with `moves` and the `formulas`. */
export function placing(
  names: readonly string[],
  moves: MoveSet,
  formulas: readonly (readonly Move[])[] = [],
  maxDepth = 14,
) {
  const track = names.map(homeOf)
  const macros = beside(moves, formulas)
  return (cube: Cube): Move[] => solvePieces(cube, { track, moves, macros, maxDepth })
}

/** A phase reaching `goal` on the named pieces (they alone are tracked,
 *  so the formulas must leave the others be), with `moves` and the
 *  `formulas`; `key` projects the pieces on what the goal reads. */
export function reaching(
  names: readonly string[],
  goal: (pieces: readonly Cubie[]) => boolean,
  moves: MoveSet,
  formulas: readonly (readonly Move[])[],
  key?: (pieces: readonly Cubie[]) => string,
) {
  const track = names.map(homeOf)
  const macros = beside(moves, formulas)
  return (cube: Cube): Move[] =>
    solvePieces(cube, { track, moves, macros, goal, maxDepth: 12, ...(key && { key }) })
}

/** The top layer's pieces. */
export const TOP_EDGES = ['UF', 'UR', 'UB', 'UL'] as const
export const TOP_CORNERS = ['UFR', 'URB', 'UBL', 'ULF'] as const
export const TOP = [...TOP_EDGES, ...TOP_CORNERS] as const

/** The top edges in their slots or not, the top color up (the top cross). */
export const topEdgesUp = (cubies: readonly Cubie[]): boolean =>
  cubies
    .filter((c) => c.stickers.length === 2 && c.position[1] === 1)
    .every((c) => c.stickers.find((s) => s.color === FACE_COLOR.U)?.normal[1] === 1)

/** The top corners in their slots, however twisted. */
export const topCornersPlaced = (cubies: readonly Cubie[]): boolean =>
  TOP_CORNERS.every((name) => pieceInSlot(cubies, name))

/** Where the corners stand, however twisted: all a corners' placement
 *  reads. */
export const cornerPlaces = (cubies: readonly Cubie[]): string =>
  cubies
    .filter((c) => c.stickers.length === 3)
    .map((c) => `${colorsOf(c)}@${c.position.join()}`)
    .sort()
    .join(' ')

/** Every named piece home (whole puzzle or tracked pieces). */
export const home =
  (names: readonly string[]) =>
  (cubies: readonly Cubie[]): boolean =>
    piecesHome(cubies, names)

// ---------------------------------------------------------------------------
// START: the position each page's formulas are played from
// ---------------------------------------------------------------------------

const marked = (c: Cubie) => c.stickers.some(isMark)

/** A cubie as a search reads it: where it is, its stickers by normal (its
 *  colors erased unless `colors`). */
const cubieKey = (c: Cubie, colors: boolean) =>
  `${c.position.join()}:${c.stickers
    .map((s) => `${s.normal.join()}${colors || isMark(s) ? s.color : ''}`)
    .sort()
    .join(';')}`

/** Where the blocks are (which, with `identity`), however listed. */
const blocksKey = (cube: Cube, identity: boolean) =>
  cube
    .filter(marked)
    .map((c) => cubieKey(c, identity))
    .sort()
    .join(' ')

/**
 * A phase bringing the blocks where they are in `start` (fan2cube's
 * position START), each block itself with `identity`, or any block of its
 * shape there without: a breadth-first search over the blocks alone, with
 * the puzzle's turns (the blocks say which go), a few thousand arrangements
 * at most.
 */
export function toStart(start: Cube, identity: boolean) {
  const goal = blocksKey(start, identity)
  return (cube: Cube): Move[] => {
    const turns = allTurnsOf(cubeShape(cube)).turns as Move[]
    return found(
      searchFormulas(
        cube.filter(marked),
        turns.map((turn) => [turn]),
        (blocks) => blocksKey(blocks, identity) === goal,
        {
          key: (blocks) => blocksKey(blocks, identity),
          mechanism: [3, 3, 3],
          allowed: (blocks, [turn]) => cutsNoBlock(blocks, turn!),
        },
      ),
      'toStart: the blocks cannot get there',
    )
  }
}

/** Whether the blocks stand as in `start` (any block of a shape, without
 *  `identity`). */
export const blocksAt =
  (start: Cube, identity: boolean) =>
  (cube: Cube): boolean =>
    blocksKey(cube, identity) === blocksKey(start, identity)

/** Every named place holding what it holds in `target`. */
export const asIn =
  (target: Cube, names: readonly string[]) =>
  (cubies: readonly Cubie[]): boolean =>
    names.every((name) => {
      const at = homeOf(name).join()
      const want = target.find((c) => c.position.join() === at)!
      const have = cubies.find((c) => c.position.join() === at)
      return have !== undefined && cubieKey(have, true) === cubieKey(want, true)
    })

/** The places of a state's blocks, by name: what a search must track for
 *  the turns that go to be known. */
const blockPlaces = (cube: Cube): string[] => cube.filter(marked).map((c) => nameAt(c.position))

const LETTERS: Record<string, string> = {
  '1,0,0': 'R',
  '-1,0,0': 'L',
  '0,1,0': 'U',
  '0,-1,0': 'D',
  '0,0,1': 'F',
  '0,0,-1': 'B',
}

/** A place's name (pieces3's `homeOf` backwards): 'O' for the core. */
function nameAt(p: readonly number[]): string {
  const name = p
    .map((v, a) => (v ? LETTERS[[0, 1, 2].map((b) => (b === a ? v : 0)).join()]! : ''))
    .join('')
  return name || 'O'
}

/** The pieces at the named places of `target`, there however turned. */
export const inPlaces =
  (target: Cube, names: readonly string[]) =>
  (cubies: readonly Cubie[]): boolean =>
    names.every((name) => {
      const at = homeOf(name).join()
      const want = target.find((c) => c.position.join() === at)!
      const have = cubies.find((c) => c.position.join() === at)
      return have !== undefined && colorsOf(have) === colorsOf(want)
    })

/** The pieces of the named places of `target` among those places, in any
 *  order, however turned. */
export const amongPlaces =
  (target: Cube, names: readonly string[]) =>
  (cubies: readonly Cubie[]): boolean => {
    const ats = names.map((name) => homeOf(name).join())
    const wanted = ats.map((at) => colorsOf(target.find((c) => c.position.join() === at)!)).sort()
    const there = ats.map((at) => cubies.find((c) => c.position.join() === at))
    return (
      there.every(Boolean) &&
      there
        .map((c) => colorsOf(c!))
        .sort()
        .join() === wanted.join()
    )
  }

/** Where the pieces are, however turned, and the blocks exactly (a
 *  formula may swap two blocks alike): all a goal of places (`inPlaces`)
 *  and blocks (`blocksAt`) reads. */
const placesKey = (cubies: readonly Cubie[]) =>
  cubies
    .map((c) => (marked(c) ? cubieKey(c, true) : `${colorsOf(c)}@${c.position.join()}`))
    .sort()
    .join(' ')

/** The blocks' arrangement and the other pieces exactly: all a goal of
 *  pieces done (`asIn`) and forms reads. */
const piecesKey = (cubies: readonly Cubie[]) =>
  cubies
    .map((c) => cubieKey(c, !marked(c)))
    .sort()
    .join(' ')

/**
 * A phase of a bandaged puzzle's method, towards `target` (its START, or
 * solved): the named places brought to hold what they hold there (or to
 * meet `goal`, read on the tracked pieces, `key` saying what it reads),
 * with the turns `free` lets go there and the page's `formulas`. Every
 * block is tracked, so the turns the blocks jam are known; the places
 * already done are listed again, so nothing goes back.
 */
export function phaseAs(
  target: Cube,
  names: readonly string[],
  {
    free,
    formulas = [],
    goal,
    key,
    maxDepth = 14,
  }: {
    free: MoveSet
    formulas?: readonly (readonly Move[])[]
    goal?: (cubies: readonly Cubie[]) => boolean
    key?: 'places' | 'pieces'
    maxDepth?: number
  },
) {
  const macros = beside(free, formulas)
  // Each place once, however it is named ('FR' or 'RF').
  const track = [
    ...new Map([...blockPlaces(target), ...names].map(placeOf).map((p) => [p.join(), p])).values(),
  ]
  return (cube: Cube): Move[] =>
    solvePieces(cube, {
      track,
      moves: free,
      macros,
      maxDepth,
      target,
      legal: legalTurn,
      ...(goal && { goal }),
      ...(key && { key: key === 'places' ? placesKey : piecesKey }),
    })
}

/** Every place of a 3x3x3 but its core, by name. */
export const EVERY_PLACE: readonly string[] = [-1, 0, 1]
  .flatMap((x) => [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => nameAt([x, y, z]))))
  .filter((name) => name !== 'O')

const placeOf = (name: string): Vec3 => (name === 'O' ? [0, 0, 0] : homeOf(name))

const legalTurn = (pieces: Cube, turn: Turn) => !('face' in turn) || cutsNoBlock(pieces, turn)
