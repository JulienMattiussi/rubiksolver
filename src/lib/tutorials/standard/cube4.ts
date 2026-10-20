import { FACE_COLOR } from '../../core/cube'
import { FACE_NORMAL, faceOfNormal } from '../../core/geometry'
import { applyMoves } from '../../core/turn'
import type { Cube, Face, Move, Turn, Vec3 } from '../../core/types'
import {
  BELT_GENERATORS,
  centerIndices,
  centersDone,
  centersKeyFor,
  VERTICAL_GENERATORS,
} from '../../methods/standard/solver4/centers'
import {
  JOIN_P,
  JOIN_U,
  L2E,
  pairEdges,
  pairedCount,
  pairedWings,
} from '../../methods/standard/solver4/edges'
import {
  edgeFlipParity,
  OLL_PARITY,
  permSignsMatch,
  PLL_PARITY,
} from '../../methods/standard/solver4/parity'
import { search } from '../../solve/solverKit'
import { projected, tutorialOf, type Kept, type Target } from '../../teach/kit'
import type { TutorialPick } from '../../teach/tutorial'
import { FIRST_LAYERS } from './cube3'
import { LAST_LAYER } from './cube3LastLayer'
import { PROJECT_4 } from './reduced'
import { CLOCKWISE, CORNER, COUNTERCLOCKWISE, THICKNESSES } from './terms'
import { CENTER4, EDGE4, INNER, WING } from './termsBig'

/**
 * The 4x4's tutorial, by reduction (yellow down, white up: its centers say
 * nothing until they are built, so the colors' faces are the usual ones):
 *   1. the centers, one piece at a time (yellow, white, then the belt);
 *   2. the edges paired, one at a time: an inner slice, an edge swapped in,
 *      the slice back;
 *   then the 3x3's stages on its projection (the reduced 4x4 turns as a 3x3),
 *   with its two parities where they show: a single edge upside down just
 *   before the white cross (OLL parity), two edges swapped just before the
 *   white edges (PLL parity), each fixed by its slice formula.
 */

// ---------------------------------------------------------------------------
// 1. The centers
// ---------------------------------------------------------------------------

/** The faces in the order their centers are built. */
const ORDER: readonly Face[] = ['D', 'U', 'F', 'R', 'B', 'L']

const isCenter = (cube: Cube, i: number) => cube[i]!.stickers.length === 1
const onItsFace = (cube: Cube, i: number) =>
  FACE_COLOR[faceOfNormal(cube[i]!.stickers[0]!.normal)] === cube[i]!.stickers[0]!.color
const centersOn = (cube: Cube, face: Face) =>
  cube.flatMap((c, i) =>
    isCenter(cube, i) && faceOfNormal(c.stickers[0]!.normal) === face && onItsFace(cube, i)
      ? [i]
      : [],
  )

/** The face being built: the first, in order, not full yet. */
const building = (cube: Cube) => ORDER.find((f) => centersOn(cube, f).length < 4) ?? null

/** The face a center place belongs to. */
const faceAt = (slot: Vec3): Face =>
  (['R', 'L', 'U', 'D', 'F', 'B'] as const).find((f) =>
    FACE_NORMAL[f].every((n, a) => n === 0 || n * slot[a]! > 2),
  )!

/** The searches see the centers only (one color's alike), up and down
 *  slices for the top and bottom, side ones for the belt. */
const searchCenters = (cube: Cube, face: Face, goal: (c: Cube) => boolean, key = '') => {
  const centers = centersKeyFor(centerIndices(cube))
  const vertical = face === 'U' || face === 'D'
  return search(
    cube,
    goal,
    vertical ? VERTICAL_GENERATORS : BELT_GENERATORS,
    vertical ? 5 : 6,
    (c) => centers(c) + key,
  )
}

/** Whether a state keeps the faces built so far, and has `face` one more
 *  than `than`. */
const oneMore = (face: Face, than: Cube) => {
  const before = ORDER.slice(0, ORDER.indexOf(face))
  const more = centersOn(than, face).length + 1
  return (c: Cube) =>
    centersOn(c, face).length >= more && before.every((f) => centersOn(c, f).length === 4)
}

/** The next center to place, as the solver's search finds it (once per
 *  state): its moves, the center it brings, and where it lands. */
const NEXT = new WeakMap<Cube, { moves: Move[]; piece: number; slot: Vec3 } | null>()
function nextCenter(cube: Cube) {
  if (NEXT.has(cube)) return NEXT.get(cube)!
  const face = building(cube)
  let found = null
  if (face) {
    const moves = searchCenters(cube, face, oneMore(face, cube))
    const after = applyMoves(cube, moves)
    const was = new Set(centersOn(cube, face))
    const piece = centersOn(after, face).find((i) => !was.has(i))
    if (piece !== undefined) found = { moves, piece, slot: after[piece]!.position }
  }
  NEXT.set(cube, found)
  return found
}

/** The centers, read where the step began: per face, its first, second...
 *  center of its color (any of the four: they look the same), the next one
 *  the one the search brings, where it lands. */
function centerTargets(begun: Cube): Target[] {
  const next = nextCenter(begun)
  return ORDER.flatMap((face) => {
    const placed = centersOn(begun, face).length
    return [1, 2, 3, 4].map((k): Target => ({
      interchangeable: true,
      piece: (cube) =>
        k <= placed ? centersOn(cube, face)[k - 1]! : (next?.piece ?? centersOn(cube, face)[0]!),
      slot: next && k === placed + 1 ? next.slot : FACE_NORMAL[face],
      placed: (cube) => centersOn(cube, face).length >= k,
    }))
  })
}

/** The way to the pick's place, the centers placed kept: the search's own
 *  if it is its pick, else one for that center (any place of its face). */
function centerFormula(cube: Cube, pick: TutorialPick, kept: Kept): Move[] {
  const next = nextCenter(kept.begun)
  if (cube === kept.begun && next && next.piece === pick.piece) return next.moves
  const face = faceAt(pick.slot)
  const more = oneMore(face, kept.begun)
  const goal = (c: Cube) =>
    faceOfNormal(c[pick.piece]!.stickers[0]!.normal) === face && more(c) && kept.targetsKept(c)
  return searchCenters(cube, face, goal, `|${pick.piece}`)
}

// ---------------------------------------------------------------------------
// 2. The edges paired
// ---------------------------------------------------------------------------

/** The solver's next pairing, up to the edge it pairs, its slice back
 *  (the centers whole again); once per state. */
const PAIRING = new WeakMap<Cube, Turn[] | null>()
function nextPairing(cube: Cube): Turn[] | null {
  if (PAIRING.has(cube)) return PAIRING.get(cube)!
  let found: Turn[] | null = null
  if (pairedCount(cube) < 12) {
    const before = pairedCount(cube)
    const moves = pairEdges(cube)
    let state = cube
    for (let n = 0; n < moves.length && !found; n++) {
      state = applyMoves(state, [moves[n]!])
      if (pairedCount(state) > before && centersDone(state)) found = moves.slice(0, n + 1)
    }
  }
  PAIRING.set(cube, found)
  return found
}

/** The wings a pairing joins (paired after, not before). */
const joined = (cube: Cube, moves: readonly Turn[]) => {
  const before = new Set(pairedWings(cube))
  return pairedWings(applyMoves(cube, moves)).filter((i) => !before.has(i))
}

// ---------------------------------------------------------------------------
// The parities, where they show
// ---------------------------------------------------------------------------

const project = PROJECT_4.project
const top = (amount: number): Move[] =>
  amount % 4 === 0 ? [] : [{ face: 'U', amount: (amount % 4) as 1 | 2 | 3 }]

/** The OLL parity's formula: the top turned to bring an edge with its white
 *  not up to the front, then the slices flipping it. */
function ollParity(cube: Cube): Turn[] {
  const front = [0, 1, 2, 3].find((t) => {
    const edge = project(applyMoves(cube, top(t))).find(
      (c) => c.position.join() === '0,1,1' && c.stickers.length === 2,
    )
    return edge?.stickers.find((s) => s.normal[1] === 1)?.color !== FACE_COLOR.U
  })
  return [...top(front ?? 0), ...OLL_PARITY]
}

/** The wings at the front of the top (the OLL parity's), or at its front
 *  and back (the PLL parity's). */
const wingsAt = (cube: Cube, places: readonly string[]) =>
  cube.flatMap((c, i) =>
    c.stickers.length === 2 && places.some((p) => c.position.join() === p) ? [i] : [],
  )
const FRONT_TOP = ['-1,3,3', '1,3,3']
const BACK_TOP = ['-1,3,-3', '1,3,-3']

export const CUBE4_TUTORIAL = tutorialOf({
  glossary: [CENTER4, WING, EDGE4, CORNER, INNER, CLOCKWISE, COUNTERCLOCKWISE, ...THICKNESSES],
  // The usual colors' faces: the centers say nothing until built.
  faceColor: (_, normal) => FACE_COLOR[faceOfNormal(normal)],
  stages: [
    {
      kind: 'pieces',
      key: 'stepTutorialCenters4',
      stage: 1,
      targets: centerTargets,
      words: true,
      hold: () => 'F',
      formula: centerFormula,
    },
    {
      kind: 'figures',
      key: 'stepTutorialPair4',
      stage: 2,
      done: (cube) => centersDone(cube) && pairedCount(cube) === 12,
      figures: [
        {
          key: 'figurePairEdge',
          match: (cube) => {
            const moves = nextPairing(cube)
            return moves && { hold: 'F', moves }
          },
        },
      ],
      focus: (cube) => {
        const moves = nextPairing(cube)
        return moves ? joined(cube, moves) : []
      },
      progress: (cube) => ({ done: pairedCount(cube), total: 12 }),
      algorithms: [[JOIN_U], [JOIN_P], [L2E]],
    },
    ...FIRST_LAYERS.map((stage, i) => projected(stage, PROJECT_4, 3 + i)),
    {
      kind: 'figures',
      key: 'stepTutorialOllParity4',
      stage: 6,
      side: FACE_NORMAL.U,
      done: (cube) => edgeFlipParity(project(cube)) === 0,
      figures: [
        { key: 'figureOllParity', match: (cube) => ({ hold: 'F', moves: ollParity(cube) }) },
      ],
      focus: (cube) =>
        wingsAt(applyMoves(cube, ollParity(cube).slice(0, -OLL_PARITY.length)), FRONT_TOP),
      progress: (cube) => ({ done: edgeFlipParity(project(cube)) === 0 ? 1 : 0, total: 1 }),
      algorithms: [[OLL_PARITY]],
    },
    projected(LAST_LAYER[0]!, PROJECT_4, 7),
    {
      kind: 'figures',
      key: 'stepTutorialPllParity4',
      stage: 8,
      side: FACE_NORMAL.U,
      done: (cube) => permSignsMatch(project(cube)),
      figures: [{ key: 'figurePllParity', match: () => ({ hold: 'F', moves: PLL_PARITY }) }],
      focus: (cube) => wingsAt(cube, [...FRONT_TOP, ...BACK_TOP]),
      progress: (cube) => ({ done: permSignsMatch(project(cube)) ? 1 : 0, total: 1 }),
      algorithms: [[PLL_PARITY]],
    },
    ...LAST_LAYER.slice(1).map((stage, i) => projected(stage, PROJECT_4, 9 + i)),
  ],
})
