import { FACE_COLOR, solvedCube } from '../../core/cube'
import { faceOfNormal, mapVec, vecKey } from '../../core/geometry'
import { allTurnsOf } from '../../core/moveSet'
import {
  applyCopterMove,
  COPTER_AXES,
  COPTER_EDGES,
  COPTER_TURNS,
  parseCopterMoves,
} from '../../puzzles/diagonal/copter'
import { solvePieces } from '../../solve/pieceSearch'
import { cycleTable, placeByCycles, uniqueHomes } from '../../solve/cycleTable'
import { projectPlan, type MethodPlan, type StepSpec } from '../../solve/solverKit'
import type { CopterMove, Cube, Cubie, Vec3 } from '../../core/types'
import { once } from '../../solve/once'
import { colorRenames, colorsOf, recolored, withStickers } from '../../core/pieces'
import { heldEveryWay } from '../../solve/everyWay'

/**
 * The Curvy Copters, "les arêtes d'abord", as taught on fan2cube.fr
 * (curvycopter2, curvycopterIII2). The edges never leave their slots and
 * set the faces' colors:
 *
 *   1. The edges      each turned the right way up, by its own turn
 *   2. The centers    (the III) (H) -> (A) -> (D) = (DA)²
 *   3. The corners    placed by (DA)² (the Curvy Copter's (HAG) -> (HPD) ->
 *                     (HDA)), or (DADP)² and Q = (PGPD)²(PDPG)² (the III's
 *                     (HGP) -> (HAG) -> (HPD)), then turned by
 *                     (DA)².G(DP)²G, or (DADP)²(ADAG)²
 *   4. The leaves     (DEAE)² (the Curvy Copter's {HDA} -> {HAG} -> {HPD}),
 *                     or (AEDE)² and V = ((AD)²E)4 (the III's)
 *   5. The petals     (the III) T = (DG)² PAP (GD)² PAP and its mirror X
 *
 * Each formula from every side of the cube, then set up by a turn (undone
 * after), until every 3-cycle of its pieces is found (cycleTable.ts). Every
 * formula turns each edge an even number of times: the edges stay right.
 * A turn swaps two corners and flips an edge ("dir(arêtes) = sig(sommets)"):
 * with the edges right, the corners (and the III's centers, swapped two by
 * each turn as well) are evenly permuted, which 3-cycles place. The 60
 * degree turns are left out, so a leaf never leaves its orbit (four of six,
 * one leaf of each color) and no parity arises. Each formula's effect is
 * asserted in tests/unit/puzzles/diagonal/copter.test.ts.
 */

/** A formula seen from every side of the cube: each of its 24 holdings
 *  turning each edge's axis. */
const fromEverySide = (formula: string): CopterMove[][] =>
  heldEveryWay(
    parseCopterMoves(formula),
    ({ edge }, by) => {
      const axis = by(COPTER_AXES[edge]).join()
      return { edge: COPTER_EDGES.find((e) => COPTER_AXES[e].join() === axis)! }
    },
    { once: true, inverses: true },
  )

const nonZero = (c: Cubie) => c.position.filter((v) => v !== 0).length
const isCorner = withStickers(3)
const isEdge = withStickers(2)
const isCenter = (c: Cubie) => c.stickers.length === 1 && nonZero(c) === 1
const isPetal = (c: Cubie) => c.stickers.length === 1 && nonZero(c) === 2
const isLeaf = (c: Cubie) => c.stickers.length === 1 && nonZero(c) === 3

/** Each sticker the color of the face it is on. */
const right = (c: Cubie) => c.stickers.every((s) => s.color === FACE_COLOR[faceOfNormal(s.normal)])

/** The color a slot of one sticker wants: its face's (the axis it is
 *  farthest out along). */
function want(p: Vec3): string {
  const axis = p.reduce((best, v, a) => (Math.abs(v) > Math.abs(p[best]!) ? a : best), 0)
  const normal = [0, 0, 0]
  normal[axis] = Math.sign(p[axis]!)
  return FACE_COLOR[faceOfNormal(normal as unknown as Vec3)]
}

/** The turn of the edge at `position`. */
const edgeAt = (position: Vec3): CopterMove => ({
  edge: COPTER_EDGES.find((e) => vecKey(COPTER_AXES[e]) === vecKey(mapVec(position, Math.sign)))!,
})

/** Each piece of a kind sent to a slot of its color in its own `group`
 *  (a leaf's orbit; any for the petals, alike four by four): those right
 *  stay, the others go to the wrong slots of their color. */
const alikeHomes =
  (kind: (c: Cubie) => boolean, group: (p: Vec3) => number) =>
  (state: Cube): Map<string, string> => {
    const pieces = state.filter(kind)
    const free = pieces.filter((c) => !right(c)).map((c) => c.position)
    return new Map(
      pieces.map((c) => {
        const at = vecKey(c.position)
        if (right(c)) return [at, at]
        const color = c.stickers[0]!.color
        const slot = free.findIndex((s) => want(s) === color && group(s) === group(c.position))
        return [at, vecKey(free.splice(slot, 1)[0]!)]
      }),
    )
  }

/** The orbit of each slot of a kind under the turns, numbered. */
function orbits(solved: Cube, kind: (c: Cubie) => boolean): (p: Vec3) => number {
  const of = new Map<string, number>()
  let n = 0
  for (const start of solved.filter(kind)) {
    if (of.has(vecKey(start.position))) continue
    let frontier: Cube = [{ position: start.position, stickers: [] }]
    of.set(vecKey(start.position), n)
    while (frontier.length) {
      frontier = frontier.flatMap((c) =>
        COPTER_TURNS.flatMap((turn) => {
          const [next] = applyCopterMove([c], turn)
          if (of.has(vecKey(next!.position))) return []
          of.set(vecKey(next!.position), n)
          return [next!]
        }),
      )
    }
    n++
  }
  return (p) => of.get(vecKey(p))!
}

interface CopterFormulas {
  readonly centers?: readonly string[]
  readonly corners: readonly string[]
  readonly twist: string
  readonly leaves: readonly string[]
  readonly petals?: readonly string[]
}

/**
 * The puzzle as its edges hold it: they never leave their slots, so their
 * colors say how it is held (which way up, which side in front); each color
 * renamed to the standard one of that face, a plan made for it held as
 * solved plays as it stands.
 */
function heldByEdges(shape: 'copter' | 'copter3', plan: MethodPlan): MethodPlan {
  const solved = solvedCube(shape)
  const pairs = new Map(solved.filter(isEdge).map((c) => [vecKey(c.position), colorsOf(c)]))
  const renames = colorRenames(solved)
  const upright = (cube: Cube): Cube => {
    for (const rename of renames) {
      const held = recolored(cube, rename)
      if (held.filter(isEdge).every((c) => pairs.get(vecKey(c.position)) === colorsOf(c)))
        return held
    }
    throw new Error('copter: its edges hold no way')
  }
  return projectPlan(plan, upright)
}

/** The plan of a Curvy Copter, from its page's formulas. */
function copterPlan(shape: 'copter' | 'copter3', formulas: CopterFormulas): MethodPlan {
  const SOLVED = solvedCube(shape)
  const TURNS = allTurnsOf(shape)
  const homeOf = (kinds: readonly ((c: Cubie) => boolean)[]) => (cube: Cube) =>
    cube.filter((c) => kinds.some((k) => k(c))).every(right)
  const allHome = (kind: (c: Cubie) => boolean) => (cube: Cube) =>
    cube.filter(kind).every((c) => right(c))
  /** Every 3-cycle of a kind, the kinds placed after free to move. */
  const table = (
    kind: (c: Cubie) => boolean,
    list: readonly string[],
    later: (c: Cubie) => boolean,
  ) => {
    return once(() => cycleTable(SOLVED, kind, list.flatMap(fromEverySide), COPTER_TURNS, later))
  }
  const placed =
    (kinds: readonly ((c: Cubie) => boolean)[], also?: (c: Cube) => boolean) => (cube: Cube) =>
      homeOf(kinds)(cube) && (!also || also(cube))
  const cornersIn = (cube: Cube) => {
    const homes = uniqueHomes(SOLVED, isCorner)(cube)
    return [...homes].every(([at, to]) => at === to)
  }

  const steps: StepSpec[] = [
    {
      key: 'stepCopterEdges',
      goal: allHome(isEdge),
      moves: TURNS,
      // An edge only turns with its own turn: once each the wrong way up.
      phases: [(cube) => cube.filter((c) => isEdge(c) && !right(c)).map((c) => edgeAt(c.position))],
    },
  ]
  const done: ((c: Cubie) => boolean)[] = [isEdge]
  if (formulas.centers) {
    const centers = table(isCenter, formulas.centers, (c) => !isEdge(c) && !isCenter(c))
    done.push(isCenter)
    steps.push({
      key: 'stepCopterCenters',
      goal: placed([...done]),
      moves: TURNS,
      phases: [(cube) => placeByCycles(cube, centers(), uniqueHomes(SOLVED, isCenter))],
    })
  }
  const settled = [...done]
  const corners = table(isCorner, formulas.corners, (c) => isLeaf(c) || isPetal(c))
  steps.push({
    key: 'stepCopterCorners',
    goal: placed(settled, cornersIn),
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, corners(), uniqueHomes(SOLVED, isCorner))],
  })
  const twists = fromEverySide(formulas.twist)
  const CORNERS = SOLVED.filter(isCorner).map((c) => c.position)
  done.push(isCorner)
  steps.push({
    key: 'stepCopterTwist',
    goal: placed([...done]),
    moves: TURNS,
    phases: [
      (cube) =>
        solvePieces<CopterMove>(cube, {
          track: CORNERS,
          moves: { generators: [], turns: [] },
          macros: twists,
          maxDepth: 6,
        }),
    ],
  })
  const orbitOf = orbits(SOLVED, isLeaf)
  const leaves = table(isLeaf, formulas.leaves, isPetal)
  done.push(isLeaf)
  steps.push({
    key: 'stepCopterLeaves',
    goal: placed([...done]),
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, leaves(), alikeHomes(isLeaf, orbitOf))],
  })
  if (formulas.petals) {
    const petals = table(isPetal, formulas.petals, () => false)
    steps.push({
      key: 'stepCopterPetals',
      goal: (cube) => cube.every(right),
      moves: TURNS,
      phases: [
        (cube) =>
          placeByCycles(
            cube,
            petals(),
            alikeHomes(isPetal, () => 0),
          ),
      ],
    })
  }
  return steps
}

/** (HAG) -> (HPD) -> (HDA), and the Curvy Copter's other formulas. */
export const COPTER_FORMULAS: CopterFormulas = {
  corners: ['(DA)²'],
  twist: '(DA)² .G(DP)²G',
  leaves: ['(DEAE)²'],
}

/** The Curvy Copter III's. */
export const COPTER3_FORMULAS: CopterFormulas = {
  centers: ['(DA)²'],
  corners: ['(DADP)²', '(PGPD)² (PDPG)²'],
  twist: '(DADP)²(ADAG)²',
  leaves: ['(AEDE)²', '((AD)² E)4'],
  petals: ['(DG)² PAP (GD)² PAP', '(GD)² PAP (DG)² PAP'],
}

export const COPTER_PLAN = heldByEdges('copter', copterPlan('copter', COPTER_FORMULAS))
export const COPTER3_PLAN = heldByEdges('copter3', copterPlan('copter3', COPTER3_FORMULAS))
