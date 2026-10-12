import { isSolved, solvedCube } from '../cube'
import { colorsOf, homesOf } from '../pieces'
import { normalIndex } from '../geometry'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import { applyMoves } from '../turn'
import type { Color, Cube, Cubie, PyraMove, PyraVertex, Vec3 } from '../types'
import {
  alignCorners,
  cornersDone,
  faceColors,
  formula as pyraFormula,
  FORMULAS_ONLY,
  fromEverySide,
  pyraSet,
  showsFaces,
  undoAll,
} from './pyraKit'

/**
 * Master Pyraminx, "wings then midges", as taught on fan2cube.fr
 * (pyraminx42), with its slices only (never a face: a face turn is the whole
 * puzzle turned with the three other slices):
 *
 *   1. Co-tips          a first-slice turn each, like the Pyraminx's centers
 *   2. Tips             a tip turn each
 *   3. Centers          placed with second-slice turns (each a 3-cycle of
 *                       centers): the formulas of step 5 can only swap them
 *                       two by two, so a 3-cycle must be undone now
 *   4. Wings            3-cycles of a face's wings: [H'₁ D₂], [H₁ G'₂],
 *                       [H₂ G'₁], [H'₂ D₁] (reserve, raise, take, lower),
 *                       from every side, set up by turns, one wing placed
 *                       at a time
 *   5. Midges           placed with [H'₂ D₂] and D₂ H₂ D'₂ H₂ D₂ H₂ D'₂ (each
 *                       cycles three), then flipped by [G₂ D'₂][H'₂ D₂],
 *                       (AG)° (AD)°; they leave the wings but swap centers
 *                       two by two
 *   6. Centers again    [G₂ D'₂]³ swaps them two by two: (A,B)(G,D)
 *
 * Each formula's effect is asserted in tests/unit/pyraminx4.test.ts.
 */

const SIZE = 4
const formula = pyraFormula(SIZE)

const coTip = (vertex: PyraVertex) => ({ vertex, slice: 1 as const })
const CO_TIPS = pyraSet(coTip)
const TIPS = pyraSet((vertex) => ({ vertex, tip: true }))
const SECOND = pyraSet((vertex) => ({ vertex, slice: 2 as const }))
/** Everything but the faces: tips and the two inner slices. */
const SLICES: typeof TIPS = {
  generators: [...TIPS.generators, ...CO_TIPS.generators, ...SECOND.generators],
  turns: [...TIPS.turns, ...CO_TIPS.turns, ...SECOND.turns],
}

const isWing = (c: Cubie) => c.stickers.length === 2 && c.position.some((x) => Math.abs(x) === 3)
const isMidge = (c: Cubie) => c.stickers.length === 2 && !isWing(c)
const isCenter = (c: Cubie) => c.stickers.length === 1

const home = (cube: Cube, keep: (c: Cubie) => boolean) => {
  const right = showsFaces(faceColors(cube, SIZE))
  return cube.filter(keep).every(right)
}

// ---------------------------------------------------------------------------
// Wings: 3-cycles, one wing placed at a time
// ---------------------------------------------------------------------------

const det = (a: Vec3, b: Vec3, c: Vec3): number =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) -
  a[1] * (b[0] * c[2] - b[2] * c[0]) +
  a[2] * (b[0] * c[1] - b[1] * c[0])

const WING_SLOTS = solvedCube('pyra4').filter(isWing)
const key = (p: Vec3) => p.join()

/**
 * The slot a wing belongs to: of the two slots of its colors (twins), the
 * one of its handedness. A turn keeps the handedness of a wing's position
 * and two sticker normals (a rotation keeps the sign of their determinant);
 * the twin slot has the opposite one.
 */
function wingHome(wing: Cubie, faces: Map<number, Color>): string {
  const [a, b] = wing.stickers as [Cubie['stickers'][0], Cubie['stickers'][0]]
  const own = Math.sign(det(wing.position, a.normal, b.normal))
  for (const slot of WING_SLOTS) {
    const normalOf = (color: Color) =>
      slot.stickers.find((s) => faces.get(normalIndex(s.normal)) === color)?.normal
    const [na, nb] = [normalOf(a.color), normalOf(b.color)]
    if (na && nb && Math.sign(det(slot.position, na, nb)) === own) return key(slot.position)
  }
  throw new Error('pyraminx4: a wing belongs nowhere')
}

/** Where a sequence sends each wing slot (`a` to `b`), from the solved
 *  puzzle; with `pure`, null when it also moves or twists another piece. */
function wingEffect(
  solved: Cube,
  sequence: readonly PyraMove[],
  pure: boolean,
): Map<string, string> | null {
  const after = applyMoves(solved, sequence)
  const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')
  const map = new Map<string, string>()
  for (const [i, c] of solved.entries()) {
    if (isWing(c)) map.set(key(c.position), key(after[i]!.position))
    else if (pure && pose(c) !== pose(after[i]!)) return null
  }
  return map
}

/** The id of a 3-cycle given by where it sends each slot, or null. */
function cycleOf(map: ReadonlyMap<string, string>): string | null {
  const moved = [...map].filter(([from, to]) => from !== to).map(([from]) => from)
  if (moved.length !== 3) return null
  const [a] = moved.sort() as [string]
  const b = map.get(a)!
  return `${a}>${b}>${map.get(b)}`
}

/**
 * Every wing 3-cycle, keyed by what it does, `a>b>c` (the wing in slot a
 * goes to b, b's to c, c's to a): fan2cube's four, from every side, then
 * set up by turns (undone after), the shortest of each kept. A turn s set
 * before a cycle a>b>c makes it s⁻¹(a)>s⁻¹(b)>s⁻¹(c): the cycles grow by
 * conjugation until all 440 are found.
 */
let cycles: Map<string, PyraMove[]> | undefined
export function wingCycles(): Map<string, PyraMove[]> {
  if (cycles) return cycles
  const solved = solvedCube('pyra4')
  const found = new Map<string, PyraMove[]>()
  for (const f of ["[H'1 D2]", "[H1 G'2]", "[H2 G'1]", "[H'2 D1]"]) {
    for (const sequence of fromEverySide(formula(f))) {
      const map = wingEffect(solved, sequence, true)
      const id = map && cycleOf(map)
      if (id && !found.has(id)) found.set(id, sequence)
    }
  }
  // Each setup turn, as where it takes each slot back from.
  const setups = (SLICES.turns as PyraMove[]).map((turn) => {
    const ahead = wingEffect(solved, [turn], false)!
    const back = new Map([...ahead].map(([from, to]) => [to, from]))
    return { turn, back }
  })
  let frontier = [...found.keys()]
  while (frontier.length) {
    const next: string[] = []
    for (const id of frontier) {
      const slots = id.split('>')
      for (const { turn, back } of setups) {
        const moved = slots.map((slot) => back.get(slot)!)
        const conjugate = cycleId(moved[0]!, moved[1]!, moved[2]!)
        if (found.has(conjugate)) continue
        found.set(conjugate, [turn, ...found.get(id)!, ...undoAll([turn])])
        next.push(conjugate)
      }
    }
    frontier = next
  }
  cycles = found
  return found
}

/** Place the wings one by one, each with a 3-cycle through an unplaced slot. */
function solveWings(cube: Cube): PyraMove[] {
  const table = wingCycles()
  const faces = faceColors(cube, SIZE)
  const moves: PyraMove[] = []
  let state = cube
  for (;;) {
    const wings = state.filter(isWing)
    const homeOf = new Map(wings.map((w) => [key(w.position), wingHome(w, faces)]))
    const wrong = [...homeOf].filter(([at, to]) => at !== to).map(([at]) => at)
    if (wrong.length === 0) return moves
    const [a] = wrong as [string]
    const b = homeOf.get(a)!
    // Prefer the slot holding the wing that belongs in a: two placed at once.
    const thirds = wrong
      .filter((c) => c !== a && c !== b)
      .sort((x, y) => Number(homeOf.get(y) === a) - Number(homeOf.get(x) === a))
    const cycle = thirds
      .map((c) => table.get(cycleId(a, b, c)))
      .find((sequence) => sequence !== undefined)
    if (!cycle) throw new Error('pyraminx4: the wings cannot be cycled into place')
    moves.push(...cycle)
    state = applyMoves(state, cycle)
  }
}

/** The key of the cycle a>b>c, starting from its smallest slot. */
function cycleId(a: string, b: string, c: string): string {
  const order = [a, b, c]
  const start = order.indexOf([...order].sort()[0]!)
  return [0, 1, 2].map((k) => order[(start + k) % 3]).join('>')
}

// ---------------------------------------------------------------------------
// Midges and centers: searches over fan2cube's formulas
// ---------------------------------------------------------------------------

const MIDGE_CYCLES = ["[H'2 D2]", "D2 H2 D'2 H2 D2 H2 D'2"].flatMap((f) =>
  fromEverySide(formula(f)),
)
const MIDGE_FLIPS = fromEverySide(formula("[G2 D'2][H'2 D2]"))
const CENTER_SWAPS = fromEverySide(formula("[G2 D'2][G2 D'2][G2 D'2]"))

/** Where a piece stands and which colors it wears, whichever way round. */
const placeOf = (c: Cubie) => `${key(c.position)}:${colorsOf(c)}`

/** A search over the pieces `among` selects: every one home, or (`placed`)
 *  only in its slot, whichever way round (the search then reads nothing
 *  else, which keeps it tiny). */
const solveGroup =
  (
    among: (c: Cubie) => boolean,
    moves: typeof TIPS,
    macros: PyraMove[][],
    maxDepth: number,
    placed = false,
  ) =>
  (cube: Cube) => {
    const faces = faceColors(cube, SIZE)
    const right = placed ? inSlot(faces) : showsFaces(faces)
    return solvePieces<PyraMove>(cube, {
      track: homesOf('pyra4', among),
      among,
      moves,
      macros,
      goal: (pieces) => pieces.every(right),
      ...(placed && { key: (pieces: readonly Cubie[]) => pieces.map(placeOf).join(' ') }),
      maxDepth,
    })
  }

/** Whether a piece is in the slot of its colors, whichever way round. */
const inSlot = (faces: Map<number, Color>) => (c: Cubie) =>
  c.stickers.every((s) => c.stickers.some((t) => t.color === faces.get(normalIndex(s.normal))))

const cornersGoal = (tips: boolean) => (c: Cube) => cornersDone(c, SIZE, tips)
const centersGoal = (c: Cube) => cornersDone(c, SIZE, true) && home(c, isCenter)
const wingsGoal = (c: Cube) => centersGoal(c) && home(c, isWing)
const midgesGoal = (c: Cube) => cornersDone(c, SIZE, true) && home(c, isWing) && home(c, isMidge)

export const PYRAMINX4_PLAN: MethodPlan = [
  {
    key: 'stepCoTips',
    goal: cornersGoal(false),
    moves: CO_TIPS,
    phases: [alignCorners(SIZE, false, coTip)],
  },
  {
    key: 'stepPyraTips',
    goal: cornersGoal(true),
    moves: TIPS,
    phases: [alignCorners(SIZE, true, (vertex) => ({ vertex, tip: true }))],
  },
  {
    key: 'stepPlaceCenters',
    goal: centersGoal,
    moves: SECOND,
    phases: [solveGroup(isCenter, SECOND, [], 4)],
  },
  { key: 'stepWings', goal: wingsGoal, moves: SLICES, phases: [solveWings] },
  {
    key: 'stepMidges',
    goal: midgesGoal,
    moves: SLICES,
    phases: [
      solveGroup(isMidge, FORMULAS_ONLY, MIDGE_CYCLES, 6, true),
      solveGroup(isMidge, FORMULAS_ONLY, MIDGE_FLIPS, 6),
    ],
  },
  {
    key: 'stepFinishCenters',
    goal: isSolved,
    moves: SLICES,
    phases: [solveGroup(isCenter, FORMULAS_ONLY, CENTER_SWAPS, 3)],
  },
]
