import { cubeOrientations, isSolved, solvedCube } from '../../core/cube'
import { FACE_NORMAL, faceOfNormal, rotateN } from '../../core/geometry'
import { gearTurnsOf, parseGearFormula } from '../../puzzles/gear/gear'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import {
  isGearMove,
  type Cube,
  type Cubie,
  type Dims,
  type Turn,
  type Vec3,
} from '../../core/types'
import { search } from './gear'

/**
 * The Gear Cube Extreme, "equator then corners", as taught on fan2cube.fr
 * (gearultimate2, the page calling it the Ultimate): its top and bottom
 * turn freely, its sides by gears, its middle layer's edges are no gears.
 *
 *   A. Equator       its four edges, and the centers, by any turns
 *   B. Bottom        corners lowered one at a time: (D²H)².(D²H²)²
 *   C. Top           corners by a 3-cycle and a swap of two
 *   D. Isolate       the bottom edges on the bottom: (BG²B'G'²)⁵
 *   E. Place         the edges, a pair on top and a pair below swapped
 *   F. Clips         turned right way round: D²(D²H)¹²D'²
 *   G. Gears         spun home, a third at a time: (D²H)².D⁸.(H'D'²)²
 *
 * Each step searches among its formulas only, seen from every side and set
 * up by top and bottom turns undone after (which leaves the corners be),
 * and tracks its own pieces only. The page's letters: H B G D A P are U D
 * L R F B, D² a gear move of the right face (our R2), H a quarter of the top.
 */

const MECHANISM: Dims = [3, 3, 3]
const SOLVED = solvedCube('gearX')
const HOLDINGS = cubeOrientations(SOLVED)

const isCorner = (c: Cubie) => c.stickers.length === 3
const isGear = (c: Cubie) => c.spin !== undefined
const isMiddle = (c: Cubie) => c.stickers.length === 2 && c.spin === undefined
const isCenter = (c: Cubie) => c.stickers.length === 1
const at = (c: Cubie) => c.position.join()
const pose = (c: Cubie) =>
  c.stickers
    .map((s) => s.normal.join() + s.color)
    .sort()
    .join('')
const colors = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join('')

/** The ways of holding the puzzle that keep its top and bottom (a quarter
 *  about the vertical, and upside down): a formula is seen from each. */
const HOLDS: ((v: Vec3) => Vec3)[] = [0, 2].flatMap((flip) =>
  [0, 1, 2, 3].map((k) => (v: Vec3) => rotateN(rotateN(v, 'x', flip), 'y', k)),
)
const seenFrom = (hold: (v: Vec3) => Vec3, moves: readonly Turn[]): Turn[] =>
  moves.map((m) =>
    isGearMove(m)
      ? { ...m, gear: faceOfNormal(hold(FACE_NORMAL[m.gear])) }
      : 'face' in m
        ? { ...m, face: faceOfNormal(hold(FACE_NORMAL[m.face])) }
        : m,
  )

/** Top and bottom turns to set a formula up (undone after it). */
const quarters = (face: 'U' | 'D'): Turn[][] => [
  [],
  [{ face, amount: 1 }],
  [{ face, amount: 2 }],
  [{ face, amount: 3 }],
]
const SETUPS = quarters('U').flatMap((u) => quarters('D').map((d) => [...u, ...d]))

/** A formula seen from `holds`, both ways, each set up by `setups`. */
function variants(
  formula: string,
  holds: readonly ((v: Vec3) => Vec3)[] = HOLDS,
  setups: readonly Turn[][] = SETUPS,
): Turn[][] {
  const moves = parseGearFormula(formula)
  return holds.flatMap((hold) =>
    [moves, invertMoves(moves)].flatMap((m) =>
      setups.map((setup) => [...setup, ...seenFrom(hold, m), ...invertMoves(setup)]),
    ),
  )
}

const LOWER = '(D²H)(D²H).(D²H²)(D²H²)'
const CYCLE = "D²BH'D'²H.D²B'D'²B.D²B'D'²"
const SWAP = "G²BH'G'²HG²B'G'²BG²B'G'².H"
const INJECT = "BG²B'G'²".repeat(5)
const EDGES = "D²BD'².D4H²D4H².D²B'D'²"
const CLIPS = `D²${'D²H'.repeat(12)}D'²`
const TWIST = "D²HD²H.D8.H'D'²H'D'²"

const TOPS = quarters('U')
const UPRIGHT = HOLDS.slice(0, 4)

/** Searches `macros` on the pieces `track` keeps only, toward `goal`. */
function solveOn(
  cube: Cube,
  track: (c: Cubie) => boolean,
  macros: readonly (readonly Turn[])[],
  goal: (pieces: Cube) => boolean,
  look: (pieces: Cube) => string,
): Turn[] {
  return search(cube.filter(track), macros, goal, look, MECHANISM)
}

/** Pieces brought right one at a time, in `order` (by colors), each search
 *  keeping the ones before: as the page does, and far quicker than all at
 *  once. */
function oneAtATime(
  cube: Cube,
  track: (c: Cubie) => boolean,
  order: readonly string[],
  macros: readonly (readonly Turn[])[],
  ok: (c: Cubie) => boolean,
  look: (pieces: Cube) => string,
): Turn[] {
  let state = cube
  const moves: Turn[] = []
  for (let n = 1; n <= order.length; n++) {
    const mine = new Set(order.slice(0, n))
    const path = solveOn(
      state,
      track,
      macros,
      (p) => p.filter((c) => mine.has(colors(c))).every(ok),
      look,
    )
    state = applyMoves(state, path)
    moves.push(...path)
  }
  return moves
}

/** The plan: the solved puzzle as held is read from the middle layer and
 *  the centers once they stand (step A), each later step against it. */
function extremePlan(): MethodPlan {
  const all = allTurnsOf('gearX')
  const frameOf = (cube: Cube) =>
    HOLDINGS.find((h) =>
      h
        .filter((c) => isMiddle(c) || isCenter(c))
        .every((c) => cube.some((p) => pose(p) === pose(c))),
    )
  const homeOf = (cube: Cube) => new Map(frameOf(cube)!.map((c) => [colors(c), c]))
  const home = (h: Map<string, Cubie>, c: Cubie) => pose(h.get(colors(c))!) === pose(c)
  const placed = (h: Map<string, Cubie>, c: Cubie) => at(h.get(colors(c))!) === at(c)
  const lookOf = (show: (c: Cubie) => string) => (pieces: Cube) =>
    pieces
      .map((c) => colors(c) + show(c))
      .sort()
      .join(' ')
  const done =
    (kind: (c: Cubie) => boolean, ok: (h: Map<string, Cubie>, c: Cubie) => boolean) =>
    (cube: Cube) => {
      if (!frameOf(cube)) return false
      const h = homeOf(cube)
      return cube.filter(kind).every((c) => ok(h, c))
    }
  const bottom = (c: Cubie) => c.position[1] === -1
  const homeBottom = (h: Map<string, Cubie>, c: Cubie) => bottom(h.get(colors(c))!)
  const equatorDone = (cube: Cube) => frameOf(cube) !== undefined
  // The bottom's edges first, then the top's (the page's formulas fix one
  // below and stir the top).
  const edgeOrder = (h: Map<string, Cubie>) =>
    [...h.values()]
      .filter(isGear)
      .sort((a, b) => a.position[1] - b.position[1])
      .map(colors)
  const bottomCornersDone = (cube: Cube) =>
    equatorDone(cube) &&
    cube.filter(isCorner).every((c) => !homeBottom(homeOf(cube), c) || home(homeOf(cube), c))
  const cornersDone = done(isCorner, home)
  const isolated = (cube: Cube) =>
    cornersDone(cube) && cube.filter(isGear).every((c) => homeBottom(homeOf(cube), c) === bottom(c))
  const edgesPlaced = (cube: Cube) => cornersDone(cube) && done(isGear, placed)(cube)
  const clipsDone = (cube: Cube) => cornersDone(cube) && done(isGear, home)(cube)

  return [
    {
      key: 'stepXEquator',
      goal: equatorDone,
      moves: all,
      phases: [
        (cube) =>
          solveOn(
            cube,
            (c) => isMiddle(c) || isCenter(c),
            gearTurnsOf('gearX').map((m) => [m]),
            (p) =>
              HOLDINGS.some((h) =>
                h
                  .filter((c) => isMiddle(c) || isCenter(c))
                  .every((c) => p.some((x) => pose(x) === pose(c))),
              ),
            lookOf(pose),
          ),
      ],
    },
    {
      key: 'stepXBottomCorners',
      goal: bottomCornersDone,
      moves: all,
      phases: [
        // One corner at a time: brought over its place, lowered.
        (cube) => {
          const h = homeOf(cube)
          const targets = [...h.values()].filter((c) => isCorner(c) && bottom(c)).map(colors)
          return oneAtATime(
            cube,
            isCorner,
            targets,
            [...TOPS.slice(1), ...variants(LOWER, UPRIGHT, [[]])],
            (c) => home(h, c),
            lookOf(pose),
          )
        },
      ],
    },
    {
      key: 'stepXTopCorners',
      goal: cornersDone,
      moves: all,
      phases: [
        (cube) => {
          const h = homeOf(cube)
          return solveOn(
            cube,
            isCorner,
            [...TOPS.slice(1), ...variants(CYCLE, UPRIGHT, TOPS), ...variants(SWAP, UPRIGHT, TOPS)],
            (p) => p.every((c) => home(h, c)),
            lookOf(at),
          )
        },
      ],
    },
    {
      key: 'stepXIsolate',
      goal: isolated,
      moves: all,
      phases: [
        (cube) => {
          const h = homeOf(cube)
          return solveOn(
            cube,
            isGear,
            variants(INJECT),
            (p) => p.every((c) => homeBottom(h, c) === bottom(c)),
            (p) => p.filter(bottom).map(colors).sort().join(' '),
          )
        },
      ],
    },
    {
      key: 'stepXEdges',
      goal: edgesPlaced,
      moves: all,
      phases: [
        (cube) => {
          const h = homeOf(cube)
          return solveOn(
            cube,
            isGear,
            variants(EDGES),
            (p) => p.every((c) => placed(h, c)),
            lookOf(at),
          )
        },
      ],
    },
    {
      key: 'stepXClips',
      goal: clipsDone,
      moves: all,
      phases: [
        (cube) => {
          const h = homeOf(cube)
          return oneAtATime(
            cube,
            isGear,
            edgeOrder(h),
            variants(CLIPS),
            (c) => home(h, c),
            lookOf(pose),
          )
        },
      ],
    },
    {
      key: 'stepXGears',
      goal: isSolved,
      moves: all,
      phases: [
        (cube) =>
          oneAtATime(
            cube,
            isGear,
            edgeOrder(homeOf(cube)),
            variants(TWIST),
            (c) => !c.spin,
            lookOf((c) => String(c.spin)),
          ),
      ],
    },
  ]
}

export const GEAR_EXTREME_PLAN = extremePlan()
