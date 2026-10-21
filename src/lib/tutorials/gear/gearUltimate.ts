import { isSolved, solvedCube } from '../../core/cube'
import { CUBE_HOLDS, holdFrontRight } from '../../core/hold'
import { colorsOf, poseOf, sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, GearMove, Turn, Vec3 } from '../../core/types'
import { GEAR_CLIPS, GEAR_FORMULAS, GEAR_SPIN, GEAR_SWAP } from '../../methods/gear/gear'
import { GEAR_TURNS } from '../../puzzles/gear/gear'
import { searchFormulas } from '../../solve/formulaSearch'
import { holdingsOf, holdingsShowing } from '../../solve/holdings'
import { tutorialOf, type Kept, type Target } from '../../teach/kit'
import { asGestures, gestureChain, leading, perState, type Gesture } from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'
import { GEAR_GLOSSARY } from './gearTerms'

/**
 * The Gear Cube Ultimate's tutorial, corners first (the method of
 * fan2cube.fr's gearcube2, `methods/gear/gear.ts`), declared for the
 * tutorial kit, the cube held a side in front (`CUBE_HOLDS`). Its one move
 * is a half turn of a face (fan2cube's D², our R2), which turns the slice
 * beside it a quarter, its gears pivoting.
 *   1. the corners, one at a time, by any moves: they say how the solved
 *      cube is held (`referenceOf`);
 *   2. the edges in their places, by D4 (two moves: the slice a half turn,
 *      two pairs of edges swapped) or P²D4P'² (another pair swapped);
 *   3. their clips, by (A²D²)³ (the clips of eight edges swapped);
 *   4. their gears, by D8 (four moves: the slice's four gears pivot a
 *      third of a turn).
 * The centers follow the edges. The formulas are the method's, declared
 * once (`GEAR_FORMULAS`), each shown in the hold it reads best in.
 */

const SOLVED = solvedCube('gearU')
const HOLDINGS = holdingsOf(SOLVED)

const isCorner = (c: Cubie) => c.stickers.length === 3
const isEdge = (c: Cubie) => c.spin !== undefined
const CORNERS = SOLVED.filter(isCorner).map((c) => c.position)
const EDGES = SOLVED.filter(isEdge).map((c) => c.position)

const pieceAt = (cube: Cube, at: Vec3) => cube.find((c) => sameAt(c.position, at))!
const indexAt = (cube: Cube, at: Vec3) => cube.findIndex((c) => sameAt(c.position, at))

/** A move by face (its gear), the other way with `back`. */
const g = (gear: Face, back = false): GearMove => ({ gear, amount: back ? 3 : 1 })

/** What a state's pieces of a kind show, place by place (a search's key). */
const lookOf = (kind: (c: Cubie) => boolean, show: (c: Cubie) => string) => (cube: Cube) =>
  cube
    .filter(kind)
    .map((c) => c.position.join() + ':' + show(c))
    .sort()
    .join(' ')
const cornerLook = lookOf(isCorner, poseOf)

// ---------------------------------------------------------------------------
// The solved state aimed at
// ---------------------------------------------------------------------------

/** The corners home in a holding of the solved cube. */
const homeIn = (cube: Cube, holding: Cube) =>
  CORNERS.filter((at) => poseOf(pieceAt(cube, at)) === poseOf(pieceAt(holding, at))).length

/**
 * The solved cube as the corners will show it: the holdings the moves can
 * bring the corners to (a move turns a face a half, so a corner keeps each
 * color on its axis: a few holdings at most), the one with the most
 * corners home already, then the nearest. Once they are all home, theirs
 * (found at once: the steps after it ask on every state they search).
 */
const referenceOf = perState((cube: Cube): Cube => {
  const home = holdingsShowing(HOLDINGS, cube, isCorner)[0]
  if (home) return home
  const reached = new Map<Cube, number>()
  const seen = new Set([cornerLook(cube)])
  let frontier = [cube]
  for (let depth = 0; frontier.length; depth++) {
    for (const state of frontier) {
      for (const h of holdingsShowing(HOLDINGS, state, isCorner)) {
        if (!reached.has(h)) reached.set(h, depth)
      }
    }
    frontier = frontier.flatMap((state) =>
      GEAR_TURNS.filter((m) => m.amount === 1).flatMap((m) => {
        const next = applyMoves(state, [m])
        const key = cornerLook(next)
        if (seen.has(key)) return []
        seen.add(key)
        return [next]
      }),
    )
  }
  const ranked = [...reached].sort(
    ([a, da], [b, db]) => homeIn(cube, b) - homeIn(cube, a) || da - db,
  )
  // None: corners no move brings home (an impossible state, entered), the
  // first step then finds no formula.
  return ranked[0]?.[0] ?? HOLDINGS[0]!
})

/** Whether a place holds the piece it does in the solved state aimed at,
 *  by its colors (`turned`: and its clips' way round). */
const holds = (cube: Cube, at: Vec3, turned: boolean) => {
  const [piece, want] = [pieceAt(cube, at), pieceAt(referenceOf(cube), at)]
  return turned ? poseOf(piece) === poseOf(want) : colorsOf(piece) === colorsOf(want)
}
const countHome = (places: readonly Vec3[], turned: boolean) => (cube: Cube) =>
  places.filter((at) => holds(cube, at, turned)).length
const notHome = (places: readonly Vec3[], turned: boolean) => (cube: Cube) =>
  places.filter((at) => !holds(cube, at, turned)).map((at) => indexAt(cube, at))

// ---------------------------------------------------------------------------
// 1. The corners
// ---------------------------------------------------------------------------

/** A corner, read where the step began: the piece its place holds in the
 *  solved state aimed at. */
function cornerTargets(begun: Cube): Target[] {
  const reference = referenceOf(begun)
  return CORNERS.map((at) => {
    const want = pieceAt(reference, at)
    return {
      piece: (cube) => cube.findIndex((c) => colorsOf(c) === colorsOf(want)),
      slot: at,
      placed: (cube) => poseOf(pieceAt(cube, at)) === poseOf(want),
    }
  })
}

/** The fewest moves bringing the picked corner home, keeping those home. */
function cornerFormula(cube: Cube, pick: TutorialPick, kept: Kept): Turn[] | null {
  const want = poseOf(pieceAt(referenceOf(kept.begun), pick.slot))
  const goal = (c: Cube) => poseOf(pieceAt(c, pick.slot)) === want && kept.targetsKept(c)
  const moves = GEAR_TURNS.filter((m) => m.amount === 1).map((m) => [m])
  return searchFormulas(cube, moves, goal, { key: cornerLook })
}

// ---------------------------------------------------------------------------
// 2-4. The edges, their clips, their gears: the page's formulas
// ---------------------------------------------------------------------------

/** P²D4P'²: D4 prepared by a move of the back, undone after (the page's
 *  way of reaching another pair of edges). */
const SWAP_BACK: GearMove[] = [g('B'), ...GEAR_SWAP, g('B', true)]
/** The method's formulas (`GEAR_FORMULAS`, from every side), each read in
 *  the hold it looks most like the page's in. */
const gestures = (formulas: readonly GearMove[][], written: readonly GearMove[][]) =>
  asGestures(formulas, written, CUBE_HOLDS)
const SWAPS = gestures(GEAR_FORMULAS.swaps, [GEAR_SWAP, SWAP_BACK])
const CLIP_TURNS = gestures(GEAR_FORMULAS.clips, [GEAR_CLIPS])
const SPINS = gestures(GEAR_FORMULAS.spins, [GEAR_SPIN])

/** The first formula of the fewest reaching `goal`, states told apart by
 *  what the goal reads. */
const firstOf =
  (gestures: readonly Gesture[], goal: (cube: Cube) => boolean, key: (cube: Cube) => string) =>
  (cube: Cube) =>
    leading(gestureChain(cube, gestures, goal, { key, frame: CUBE_HOLDS }))

const edgesPlaced = (cube: Cube) =>
  countHome(CORNERS, true)(cube) === CORNERS.length &&
  countHome(EDGES, false)(cube) === EDGES.length
const clipsDone = (cube: Cube) => edgesPlaced(cube) && countHome(EDGES, true)(cube) === EDGES.length
const spins = (cube: Cube) =>
  EDGES.filter((at) => holds(cube, at, true) && pieceAt(cube, at).spin === 0).length

export const GEAR_TUTORIAL = tutorialOf({
  glossary: GEAR_GLOSSARY,
  // Held by the center in front, whichever it is now (the slices move
  // them; the hold only says which way to look).
  stages: [
    {
      kind: 'pieces',
      key: 'stepGearCorners',
      stage: 1,
      targets: cornerTargets,
      hold: (_, pick, next) => holdFrontRight(CUBE_HOLDS, (pick ?? next).slot),
      formula: cornerFormula,
    },
    {
      kind: 'figures',
      key: 'stepGearEdges',
      stage: 2,
      done: edgesPlaced,
      figures: [
        {
          key: 'figureGearSwap',
          match: perState(firstOf(SWAPS, edgesPlaced, lookOf(isEdge, colorsOf))),
        },
      ],
      focus: notHome(EDGES, false),
      progress: (cube) => ({ done: countHome(EDGES, false)(cube), total: EDGES.length }),
      algorithms: [[GEAR_SWAP], [SWAP_BACK]],
    },
    {
      kind: 'figures',
      key: 'stepGearClips',
      stage: 3,
      done: clipsDone,
      figures: [
        {
          key: 'figureGearClips',
          match: perState(firstOf(CLIP_TURNS, clipsDone, lookOf(isEdge, poseOf))),
        },
      ],
      focus: notHome(EDGES, true),
      progress: (cube) => ({ done: countHome(EDGES, true)(cube), total: EDGES.length }),
      algorithms: [[GEAR_CLIPS]],
    },
    {
      kind: 'figures',
      key: 'stepGearSpins',
      stage: 4,
      done: isSolved,
      figures: [
        {
          key: 'figureGearSpin',
          match: perState(
            firstOf(
              SPINS,
              isSolved,
              lookOf(isEdge, (c) => String(c.spin)),
            ),
          ),
        },
      ],
      focus: (cube) =>
        EDGES.filter((at) => pieceAt(cube, at).spin !== 0).map((at) => indexAt(cube, at)),
      progress: (cube) => ({ done: spins(cube), total: EDGES.length }),
      algorithms: [[GEAR_SPIN]],
    },
  ],
})
