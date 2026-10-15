import { FACE_COLOR } from '../../core/cube'
import { FACE_NORMAL, mapVec } from '../../core/geometry'
import type { FaceLabels } from '../../core/moves'
import type { CopterEdge, CopterMove, Cube, Cubie, Face, Vec3 } from '../../core/types'

/**
 * The Curvy Copters (fan2cube.fr/curvycopter1, curvycopterIII1): a
 * Helicopter Cube's mechanism, each of its twelve edges turning a half turn
 * about the axis through its middle (the 60 degree "jumbling" turns are left
 * out: a cubic mix needs none, as the page advises). A turn carries the
 * pieces about its axis, those within a cone around it: cos^2 of their angle
 * to it at least 0.4, `5 (p.e)^2 >= 4 |p|^2` with |e|^2 = 2. Its half turn
 * is v -> (v.e) e - v, integer: the model stays exact.
 *
 *   Curvy Copter (scale 4)       8 corners (4,4,4), 12 edges (0,4,4) that
 *                                only pivot, 24 leaves (2,4,2), four a face
 *                                towards its corners: a turn takes 2 corners,
 *                                its edge and 4 leaves
 *   Curvy Copter III (scale 6)   the same (corners (6,6,6), edges (0,6,6),
 *                                leaves (3,6,3)), plus 6 centers (0,6,0) and
 *                                24 petals (0,6,2), four a face towards its
 *                                edges: a turn takes 2 centers and 6 petals
 *                                too (as fan2cube.fr/curvycopterIII2 draws
 *                                the cuts: circles about each edge, past the
 *                                face's middle)
 */

/** Each edge: fan2cube's letter (Haut, Bas, Avant, Postérieur, Gauche,
 *  Droite faces; A, P, G, D the top edges, O, E, N, S the middle ones, B,
 *  H, C, T the bottom ones) and its axis. */
export const COPTER_AXES: Record<CopterEdge, Vec3> = {
  A: [0, 1, 1],
  P: [0, 1, -1],
  G: [-1, 1, 0],
  D: [1, 1, 0],
  O: [-1, 0, 1],
  E: [1, 0, 1],
  N: [-1, 0, -1],
  S: [1, 0, -1],
  B: [0, -1, 1],
  H: [0, -1, -1],
  C: [-1, -1, 0],
  T: [1, -1, 0],
}

export const COPTER_EDGES = Object.keys(COPTER_AXES) as CopterEdge[]

/** Every turn: one per edge, each its own inverse. */
export const COPTER_TURNS: readonly CopterMove[] = COPTER_EDGES.map((edge) => ({ edge }))

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Whether an edge's turn carries the piece at `position`. */
export function copterTurns(move: CopterMove, position: Vec3): boolean {
  const d = dot(position, COPTER_AXES[move.edge])
  return d > 0 && 5 * d * d >= 4 * dot(position, position)
}

/** The half turn about an edge's axis. */
const halfTurn =
  (e: Vec3) =>
  (v: Vec3): Vec3 =>
    mapVec(e, (x, a) => dot(v, e) * x - v[a]! + 0)

export function applyCopterMove(cube: Cube, move: CopterMove): Cube {
  const turn = halfTurn(COPTER_AXES[move.edge])
  return cube.map((c) =>
    copterTurns(move, c.position)
      ? {
          position: turn(c.position),
          stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
        }
      : c,
  )
}

/** The axis an edge turns about, unit, in the renderer's frame. */
export function copterAxis(edge: CopterEdge): [number, number, number] {
  return COPTER_AXES[edge].map((v) => v / Math.SQRT2) as [number, number, number]
}

const FACES = Object.keys(FACE_NORMAL) as Face[]

/** On a face, at `scale` out, a piece at (u, v) along its two other axes. */
function onFace(face: Face, scale: number, u: number, v: number): Vec3 {
  const n = FACE_NORMAL[face]
  const axis = n.findIndex((x) => x !== 0)
  const [a, b] = [0, 1, 2].filter((i) => i !== axis) as [number, number]
  const p = [0, 0, 0]
  p[axis] = n[axis]! * scale
  p[a] = u
  p[b] = v
  return p as unknown as Vec3
}

/** A piece's stickers: one on each face it lies on (|coordinate| = scale). */
function piece(position: Vec3, scale: number): Cubie {
  return {
    position,
    stickers: FACES.filter((f) => dot(FACE_NORMAL[f], position) === scale).map((f) => ({
      normal: FACE_NORMAL[f],
      color: FACE_COLOR[f],
    })),
  }
}

const SIGNS = [1, -1]

/** The pieces of a cube's corners and edges, at `scale`. */
function frame(scale: number): Cubie[] {
  const corners = SIGNS.flatMap((x) =>
    SIGNS.flatMap((y) => SIGNS.map((z): Vec3 => [x * scale, y * scale, z * scale])),
  )
  const edges = [0, 1, 2].flatMap((zero) =>
    SIGNS.flatMap((s) =>
      SIGNS.map((t) => {
        const [a, b] = [0, 1, 2].filter((i) => i !== zero) as [number, number]
        const p = [0, 0, 0]
        p[a] = s * scale
        p[b] = t * scale
        return p as unknown as Vec3
      }),
    ),
  )
  return [...corners, ...edges].map((p) => piece(p, scale))
}

/** Four pieces on each face at (u, v), turned a quarter at a time. */
const fours = (scale: number, u: number, v: number): Cubie[] =>
  FACES.flatMap((f) =>
    [
      [u, v],
      [-v, u],
      [-u, -v],
      [v, -u],
    ].map(([a, b]) => piece(onFace(f, scale, a!, b!), scale)),
  )

/** The solved Curvy Copter: corners, edges, then the leaves. */
export const solvedCurvyCopter = (): Cube => [...frame(4), ...fours(4, 2, 2)]

/** The solved Curvy Copter III: corners, edges, centers, petals, leaves. */
export const solvedCurvyCopter3 = (): Cube => [
  ...frame(6),
  ...FACES.map((f) => piece(onFace(f, 6, 0, 0), 6)),
  ...fours(6, 0, 2),
  ...fours(6, 3, 3),
]

/** A scramble: edges at random, never the same twice in a row (it would
 *  undo itself). */
export function scrambleCopter(length: number, rng: () => number): CopterMove[] {
  const moves: CopterMove[] = []
  while (moves.length < length) {
    const edge = COPTER_EDGES[Math.floor(rng() * COPTER_EDGES.length)]!
    if (edge !== moves[moves.length - 1]?.edge) moves.push({ edge })
  }
  return moves
}

/** Drop the pairs of the same edge in a row: each undoes the other. */
export function simplifyCopterMoves(moves: readonly CopterMove[]): CopterMove[] {
  const out: CopterMove[] = []
  for (const move of moves) {
    if (out[out.length - 1]?.edge === move.edge) out.pop()
    else out.push(move)
  }
  return out
}

/** Each edge in the international notation: its two faces. */
const US: Record<CopterEdge, string> = {
  A: 'UF',
  P: 'UB',
  G: 'UL',
  D: 'UR',
  O: 'FL',
  E: 'FR',
  N: 'BL',
  S: 'BR',
  B: 'DF',
  H: 'DB',
  C: 'DL',
  T: 'DR',
}

/** A turn as written: fan2cube's letter of its edge, or its two faces in
 *  the international notation. */
export function formatCopterMove(move: CopterMove, labels: FaceLabels): string {
  return labels.U === 'U' ? US[move.edge] : move.edge
}

/** Parse fan2cube's formulas (`(DA)² .G(DP)²G`, `((AD)² E)4`): one letter
 *  per edge, each a half turn (a prime, `²` or `2` changes nothing),
 *  `(...)²`, `(...)^n` or `(...)n` repeated, innermost first. */
export function parseCopterMoves(text: string): CopterMove[] {
  let expanded = text
  for (;;) {
    const next = expanded.replace(
      /\(([^()]*)\)(?:\^?(\d)|(²))?/g,
      (_, body: string, n?: string, square?: string) =>
        ` ${body} `.repeat(n ? Number(n) : square ? 2 : 1),
    )
    if (next === expanded) break
    expanded = next
  }
  return [...expanded.replace(/[²'’.\s\d]/g, '')].map((letter) => {
    if (!(letter in COPTER_AXES)) throw new Error(`parseCopterMoves: unknown edge "${letter}"`)
    return { edge: letter as CopterEdge }
  })
}
