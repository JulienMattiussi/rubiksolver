import { isSolved, stateKey } from '../../core/cube'
import { mapVec, normalIndex } from '../../core/geometry'
import type { Hold } from '../../core/hold'
import { hasColors } from '../../core/pieces'
import { simplifyMoves } from '../../core/moves'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, PyraMove, PyraVertex, Turn, Vec3 } from '../../core/types'
import {
  faceColors as pyraFaceColors,
  formula as pyraFormula,
  showsFaces,
  undo,
} from '../../methods/pyramid/pyraKit'
import { PYRA_CORNERS, PYRA_VERTICES } from '../../puzzles/pyramid/pyraminx'
import { tutorialOf, type Kept, type Target } from '../../teach/kit'
import { firstGesture, type Gesture } from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'
import { PYRA_HOLDS } from './pyraHolds'
import { PYRA_GLOSSARY } from './pyraTerms'

/**
 * The Pyraminx's tutorial, centers first (the method of fan2cube.fr's
 * pyraminx2), declared for the tutorial kit; the puzzle laid flat, a side in
 * front (`PYRA_HOLDS`). The center pieces and tips never leave their corner:
 * they say which color each face takes.
 *   1. the centers, each turned with its layer to match the others;
 *   2. the tips, each turned alone;
 *   3. the bottom edges, each brought down by the hook `[gd']` (a turn of
 *      the top first if need be), held with its slot in front;
 *   4. the top edges in their places, by `d h d' h d h d'`;
 *   5. the edges flipped two at a time, by `[gd'][h'd]`.
 */

const formula = pyraFormula(3)

/** Where a corner's center piece sits, and its tip. */
const centerAt = (v: PyraVertex): Vec3 => PYRA_CORNERS[v]
const tipAt = (v: PyraVertex): Vec3 => mapVec(PYRA_CORNERS[v], (x) => 2 * x)

const sameAt = (a: Vec3, b: Vec3) => a.join() === b.join()
const indexAt = (cube: Cube, at: Vec3) => cube.findIndex((c) => sameAt(c.position, at))
const faces = (cube: Cube) => pyraFaceColors(cube, 3)
const home = (cube: Cube, piece: number) => showsFaces(faces(cube))(cube[piece]!)

/** A tip, a center piece or an edge (the kinds the texts name; the hidden
 *  core, none). */
const pieceKind = (cubie: Cubie) => {
  if (cubie.stickers.length === 2) return 'edge'
  if (cubie.stickers.length !== 3) return 'piece'
  const reach = cubie.position.reduce((sum, x) => sum + Math.abs(x), 0)
  return reach > 4 ? 'tip' : 'center'
}

// ---------------------------------------------------------------------------
// 1-2. The corners: each center piece, then each tip, twisted in place
// ---------------------------------------------------------------------------

/** The corner a corner piece stands at (by its center's or tip's place). */
const vertexAt = (at: Vec3) =>
  PYRA_VERTICES.find((v) => sameAt(centerAt(v), at) || sameAt(tipAt(v), at))!

const cornerTarget = (v: PyraVertex, tip: boolean): Target => {
  const at = tip ? tipAt(v) : centerAt(v)
  return {
    piece: (cube) => indexAt(cube, at),
    slot: at,
    placed: (cube) => home(cube, indexAt(cube, at)),
  }
}

/** The turn of a corner (its layer, or its tip) bringing its piece home. */
const twist =
  (tip: boolean) =>
  (cube: Cube, pick: TutorialPick): Turn[] | null => {
    const vertex = vertexAt(pick.slot)
    const turns = ([1, 2] as const).map((amount): PyraMove[] => [
      { vertex, amount, ...(tip && { tip: true as const }) },
    ])
    return turns.find((m) => home(applyMoves(cube, m), pick.piece)) ?? null
  }

/** Held with the corner in sight: any side but the one behind it. */
const showing = (at: Vec3): Hold => {
  const vertex = vertexAt(at)
  return PYRA_HOLDS.holds.find((h) => h !== vertex)!
}

// ---------------------------------------------------------------------------
// 3. The bottom edges
// ---------------------------------------------------------------------------

/** An edge's place: the middle of its two corners. */
const edgeAt = (v: PyraVertex, w: PyraVertex): Vec3 => {
  const [a, b] = [PYRA_CORNERS[v], PYRA_CORNERS[w]]
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

/** The bottom's edges, each by its two corners and the one across (the
 *  back corner of the hold with it in front). */
const BOTTOM: readonly [PyraVertex, PyraVertex, PyraVertex][] = [
  ['L', 'R', 'B'],
  ['R', 'B', 'L'],
  ['B', 'L', 'R'],
]

/** A bottom edge: the one showing its sides' colors, at its place. */
const edgeTarget = ([v, w]: readonly PyraVertex[]): Target => {
  const at = edgeAt(v!, w!)
  // Its sides: the bottom (across from the top) and the one across from
  // the third bottom corner.
  const sides = (cube: Cube) => {
    const colors = faces(cube)
    const across = PYRA_VERTICES.filter((x) => x !== v && x !== w)
    return across.map((x) => colors.get(normalIndex(mapVec(PYRA_CORNERS[x], (c) => -c)))!)
  }
  return {
    piece: (cube) => cube.findIndex((c) => c.stickers.length === 2 && hasColors(c, sides(cube))),
    slot: at,
    placed: (cube) => home(cube, indexAt(cube, at)),
  }
}

const HOOK = formula("[gd']")
const TOP = formula('h')
/** The hook from each side, also after a turn of the top (undone after). */
const DOWN: Gesture[] = PYRA_HOLDS.holds.flatMap((hold) =>
  [[], TOP, TOP.map(undo)].map((setUp) => ({
    hold,
    moves: [...setUp, ...HOOK, ...[...setUp].reverse().map(undo)],
  })),
)

/** The fewest hooks bringing the picked edge home, keeping those home. */
function edgeFormula(cube: Cube, pick: TutorialPick, kept: Kept): Turn[] | null {
  const goal = (c: Cube) => sameAt(c[pick.piece]!.position, pick.slot) && home(c, pick.piece)
  const plays = DOWN.map((g) => g.moves.map((m) => PYRA_HOLDS.played(g.hold, m)))
  let frontier = [{ cube, moves: [] as Turn[] }]
  const seen = new Set([stateKey(cube)])
  for (let depth = 0; depth <= 3; depth++) {
    const found = frontier.find((n) => goal(n.cube) && kept.targetsKept(n.cube))
    // A turn of the top undone then done again by the next hook: none.
    if (found) return simplifyMoves(found.moves)
    frontier = frontier.flatMap((n) =>
      plays.flatMap((moves) => {
        const next = applyMoves(n.cube, moves)
        const key = stateKey(next)
        if (seen.has(key)) return []
        seen.add(key)
        return [{ cube: next, moves: [...n.moves, ...moves] }]
      }),
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// 4-5. The top edges: placed, then flipped
// ---------------------------------------------------------------------------

const EDGE_PLACES = PYRA_VERTICES.flatMap((v, i) =>
  PYRA_VERTICES.slice(i + 1).map((w) => edgeAt(v, w)),
)
const edges = (cube: Cube) => EDGE_PLACES.map((at) => indexAt(cube, at))
/** An edge between its sides, flipped or not. */
const between = (cube: Cube, piece: number) => {
  const colors = faces(cube)
  return cube[piece]!.stickers.every((s) =>
    cube[piece]!.stickers.some((t) => t.color === colors.get(normalIndex(s.normal))),
  )
}
/** The edges standing on top (by their places: the top corner's). */
const TOP_PLACES = PYRA_VERTICES.slice(1).map((v) => edgeAt('U', v))
const topEdges = (cube: Cube) => TOP_PLACES.map((at) => indexAt(cube, at))

/** Each side's formula, and its inverse. */
const fromEachSide = (moves: PyraMove[]): Gesture[] =>
  PYRA_HOLDS.holds.flatMap((hold) => [
    { hold, moves },
    { hold, moves: [...moves].reverse().map(undo) },
  ])

const CYCLE = formula("dhd'hdhd'")
const FLIP = formula("[gd'][h'd]")
const CYCLES = fromEachSide(CYCLE)
const FLIPS = fromEachSide(FLIP)

const placedEdges = (cube: Cube) => edges(cube).filter((i) => between(cube, i)).length
const homeEdges = (cube: Cube) => edges(cube).filter((i) => home(cube, i)).length

export const PYRAMINX_TUTORIAL = tutorialOf({
  frame: PYRA_HOLDS,
  holding: 'flat',
  pieceKind,
  glossary: PYRA_GLOSSARY,
  faceColor: (cube, normal) => faces(cube).get(normalIndex(normal)) ?? null,
  stages: [
    {
      kind: 'pieces',
      key: 'stepTutorialPyraCenters',
      stage: 1,
      targets: PYRA_VERTICES.map((v) => cornerTarget(v, false)),
      words: true,
      hold: (_, pick, next) => showing(pick?.slot ?? next.slot),
      formula: twist(false),
    },
    {
      kind: 'pieces',
      key: 'stepTutorialPyraTips',
      stage: 2,
      targets: PYRA_VERTICES.map((v) => cornerTarget(v, true)),
      words: true,
      hold: (_, pick, next) => showing(pick?.slot ?? next.slot),
      formula: twist(true),
    },
    {
      kind: 'pieces',
      key: 'stepTutorialPyraBottom',
      stage: 3,
      targets: BOTTOM.map(edgeTarget),
      algorithms: [[HOOK]],
      // Held with the slot in front: the hook reads [gd'] there.
      hold: (_, pick, next) =>
        BOTTOM.find(([v, w]) => sameAt(edgeAt(v, w), (pick ?? next).slot))![2],
      formula: edgeFormula,
      checked: true,
    },
    {
      kind: 'figures',
      key: 'stepTutorialPyraTop',
      stage: 4,
      done: (cube) => placedEdges(cube) === 6,
      figures: [
        {
          key: 'figurePyraCycle',
          match: (cube) =>
            firstGesture(cube, CYCLES, (c) => placedEdges(c) === 6, 2, PYRA_HOLDS, placedEdges),
        },
      ],
      focus: (cube) => topEdges(cube).filter((i) => !between(cube, i)),
      progress: (cube) => ({
        done: topEdges(cube).filter((i) => between(cube, i)).length,
        total: 3,
      }),
      algorithms: [[CYCLE]],
    },
    {
      kind: 'figures',
      key: 'stepTutorialPyraFlip',
      stage: 5,
      done: isSolved,
      figures: [
        {
          key: 'figurePyraFlip',
          match: (cube) => firstGesture(cube, FLIPS, isSolved, 2, PYRA_HOLDS, homeEdges),
        },
      ],
      focus: (cube) => edges(cube).filter((i) => !home(cube, i)),
      progress: (cube) => ({ done: homeEdges(cube), total: 6 }),
      algorithms: [[FLIP]],
    },
  ],
})
