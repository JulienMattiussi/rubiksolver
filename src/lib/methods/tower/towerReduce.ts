import { faceColorsOf, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, faceOfNormal } from '../../core/geometry'
import { invertMoves, movesFor } from '../../core/moves'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, CubeShape, Move, Vec3 } from '../../core/types'
import { cycleTable, placeByCycles } from '../../solve/cycleTable'

/**
 * Reduction of the big towers (4x4x3, 4x4x5, 5x5x4) to a smaller one, as
 * fan2cube.fr does (tower4432, tower4452, tower5542): their centers made
 * whole, the pieces along each edge made one, then solved as the tower they
 * have become. Each piece is brought home by a pure 3-cycle of its kind: a
 * commutator of an inner layer and a face turn or two ([A, B], [A, B C B']
 * or [A B A', C]), set up by a turn undone after (`cycleTable`).
 */

const key = (p: Vec3) => p.join()

const commutator = (a: readonly Move[], b: readonly Move[]): Move[] => [
  ...a,
  ...b,
  ...invertMoves(a),
  ...invertMoves(b),
]

/** Where everything lands under a sequence, from the solved puzzle. */
interface Effect {
  readonly moves: Move[]
  readonly after: Cube
}

const EFFECTS = new Map<string, Effect[]>()

/** The commutators to try, on a shape: an inner layer against a face turn,
 *  or against a face turn conjugating another turn; or an inner layer's
 *  conjugate of a face turn against any turn. */
function effectsOf(shape: CubeShape, extra: readonly Move[]): Effect[] {
  const id = `${shape}|${JSON.stringify(extra)}`
  let effects = EFFECTS.get(id)
  if (effects) return effects
  const solved = solvedCube(shape)
  const all = [...movesFor(shape), ...extra]
  const inner = all.filter((m) => m.depth && !m.wide)
  const faces = all.filter((m) => !m.depth)
  const sequences: Move[][] = []
  for (const a of inner) {
    for (const b of faces) {
      sequences.push(commutator([a], [b]))
      for (const c of all) {
        if (c.face !== b.face) sequences.push(commutator([a], [b, c, ...invertMoves([b])]))
        // An inner layer's commutator with a face, against a third turn.
        sequences.push(commutator([a, b, ...invertMoves([a])], [c]))
      }
    }
  }
  effects = sequences.map((moves) => ({ moves, after: applyMoves(solved, moves) }))
  EFFECTS.set(id, effects)
  return effects
}

const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')

/**
 * Every pure 3-cycle of a kind on a shape, by what it does (see
 * `cycleTable`): moving three pieces of the kind, nothing else but what
 * `mayMove` allows (kinds a later step sees to).
 */
export function towerCycles(
  shape: CubeShape,
  isKind: (c: Cubie) => boolean,
  mayMove: (c: Cubie) => boolean,
  extra: readonly Move[] = [],
): Map<string, Move[]> {
  const solved = solvedCube(shape)
  const pure = effectsOf(shape, extra).filter(({ after }) => {
    let moved = 0
    for (const [i, c] of solved.entries()) {
      if (pose(c) === pose(after[i]!)) continue
      if (isKind(c)) moved++
      else if (!mayMove(c)) return false
    }
    return moved === 3
  })
  return cycleTable(
    solved,
    isKind,
    pure.map((e) => e.moves),
    [...movesFor(shape), ...extra],
    mayMove,
  )
}

/** The color each slot of a one-sticker kind shows, solved. */
function slotColors(shape: CubeShape, isKind: (c: Cubie) => boolean): Map<string, string> {
  const faces = faceColorsOf(shape)
  return new Map(
    solvedCube(shape)
      .filter(isKind)
      .map((c) => [key(c.position), faces[faceOfNormal(c.stickers[0]!.normal)]]),
  )
}

/** Each slot's block: the slots its 3-cycles reach (a kind's pieces may
 *  be split in blocks a turn moves as a whole), by a slot of it. */
function blocksOf(table: ReadonlyMap<string, readonly Move[]>): Map<string, string> {
  const parent = new Map<string, string>()
  const root = (x: string): string => {
    const p = parent.get(x) ?? x
    return p === x ? x : root(p)
  }
  for (const id of table.keys()) {
    const [a, ...rest] = id.split('>') as [string, ...string[]]
    for (const b of rest) {
      const [ra, rb] = [root(a), root(b)]
      if (ra !== rb) parent.set(rb, ra)
    }
  }
  const slots = new Set([...table.keys()].flatMap((k) => k.split('>')))
  return new Map([...slots].map((x) => [x, root(x)]))
}

/**
 * Where each piece of a one-sticker kind goes (centers: those of a color
 * alike): itself when its slot shows its color, else a wrong slot of its
 * color in its block (a piece never leaves it, its 3-cycles neither).
 */
export function homesByColor(
  shape: CubeShape,
  isKind: (c: Cubie) => boolean,
  table: () => ReadonlyMap<string, readonly Move[]>,
) {
  const colors = slotColors(shape, isKind)
  const blocks = once(() => blocksOf(table()))
  return (state: Cube): Map<string, string> => {
    const orbit = blocks()
    const pieces = state.filter((c) => colors.has(key(c.position)))
    const wrong = pieces.filter((c) => colors.get(key(c.position)) !== c.stickers[0]!.color)
    const free = new Map<string, string[]>()
    const slotId = (slot: string, color: string) => `${orbit.get(slot)}|${color}`
    for (const c of wrong) {
      const at = key(c.position)
      const want = slotId(at, colors.get(at)!)
      free.set(want, [...(free.get(want) ?? []), at])
    }
    const homes = new Map<string, string>()
    for (const c of pieces) {
      const at = key(c.position)
      homes.set(at, wrong.includes(c) ? free.get(slotId(at, c.stickers[0]!.color))!.shift()! : at)
    }
    return homes
  }
}

/** The whole-puzzle turn carrying a solved piece where `piece` stands,
 *  sticker by sticker (matched by color). */
function carrying(solvedPiece: Cubie, piece: Cubie): (v: Vec3) => Vec3 {
  return AXIS_ROTATIONS.find(
    (turn) =>
      key(turn(solvedPiece.position)) === key(piece.position) &&
      solvedPiece.stickers.every(
        (s) => key(turn(s.normal)) === key(piece.stickers.find((t) => t.color === s.color)!.normal),
      ),
  )!
}

const det = (a: Vec3, b: Vec3, c: Vec3): number =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) -
  a[1] * (b[0] * c[2] - b[2] * c[0]) +
  a[2] * (b[0] * c[1] - b[1] * c[0])

/** A two-sticker piece's handedness: which of two twins it is (a turn keeps
 *  it). */
const handOf = (c: Cubie) =>
  Math.sign(det(c.position, c.stickers[0]!.normal, c.stickers[1]!.normal)) *
  (c.stickers[0]!.color < c.stickers[1]!.color ? 1 : -1)

/**
 * Where each wing goes: beside the middle piece of its colors, wherever that
 * stands (the 5x5x4's edges, whose middles never leave the edges' middles),
 * as it stood beside it solved.
 */
export function wingsToMiddles(
  shape: CubeShape,
  isWing: (c: Cubie) => boolean,
  isMiddle: (c: Cubie) => boolean,
) {
  const solved = solvedCube(shape)
  const colors = (c: Cubie) =>
    c.stickers
      .map((s) => s.color)
      .sort()
      .join('')
  const solvedWings = solved.filter(isWing)
  const solvedMiddles = new Map(solved.filter(isMiddle).map((c) => [colors(c), c]))
  return (state: Cube): Map<string, string> => {
    const middles = new Map(state.filter(isMiddle).map((c) => [colors(c), c]))
    return new Map(
      state.filter(isWing).map((w) => {
        const home = solvedWings.find((s) => colors(s) === colors(w) && handOf(s) === handOf(w))!
        const turn = carrying(solvedMiddles.get(colors(w))!, middles.get(colors(w))!)
        return [key(w.position), key(turn(home.position))]
      }),
    )
  }
}

/**
 * Wings of edges with no middle (the 4x4x3's, the 4x4x5's): `colorsOf`
 * gives each edge the colors most of its wings already show (the others in
 * turn), or with `swap` two edges each other's, which changes the wings'
 * parity in every block (`oddBlocks`); `homesFor` then sends each wing to
 * the slot of its edge its handedness fits. Edges of either layer take any
 * colors: a Domino puts them right.
 */
export function wingEdges(shape: CubeShape, isWing: (c: Cubie) => boolean) {
  const reach = Math.max(...solvedCube(shape).map((c) => Math.abs(c.position[0])))
  /** An edge: the wing's position, its coordinate along the edge set to 0. */
  const edgeOf = (p: Vec3) =>
    key(p.map((v, i) => (i === 1 || Math.abs(v) === reach ? v : 0)) as unknown as Vec3)
  const colors = (c: Cubie) =>
    c.stickers
      .map((s) => s.color)
      .sort()
      .join('')
  const colorsOf = (state: Cube, swap = false): Map<string, string> => {
    const wings = state.filter(isWing)
    const edges = [...new Set(wings.map((w) => edgeOf(w.position)))].sort()
    const counts = new Map<string, number>()
    for (const w of wings) {
      const id = `${edgeOf(w.position)}|${colors(w)}`
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    const given = new Map<string, string>()
    const taken = new Set<string>()
    const all = [...new Set(wings.map(colors))]
    const ranked = edges
      .flatMap((e) => all.map((c) => ({ e, c, n: counts.get(`${e}|${c}`) ?? 0 })))
      .sort((a, b) => b.n - a.n || (a.e + a.c < b.e + b.c ? -1 : 1))
    for (const { e, c } of ranked) {
      if (given.has(e) || taken.has(c)) continue
      given.set(e, c)
      taken.add(c)
    }
    if (swap) {
      const [a, b] = edges as [string, string]
      const ca = given.get(a)!
      given.set(a, given.get(b)!)
      given.set(b, ca)
    }
    return given
  }
  const homesFor =
    (given: ReadonlyMap<string, string>) =>
    (state: Cube): Map<string, string> => {
      const wings = state.filter(isWing)
      const slots = wings.map((w) => w.position)
      return new Map(
        wings.map((w) => {
          const sorted = [...w.stickers].sort((a, b) => (a.color < b.color ? -1 : 1))
          const own = Math.sign(det(w.position, sorted[0]!.normal, sorted[1]!.normal))
          const upColor = w.stickers.find((st) => st.normal[1] !== 0)!.color
          // The wing as it would stand in a slot: its top or bottom color up
          // or down, the other out to the side.
          const target = slots.find((s) => {
            if (given.get(edgeOf(s)) !== colors(w)) return false
            const up: Vec3 = [0, Math.sign(s[1]), 0]
            const out = s.map((v, i) =>
              i !== 1 && Math.abs(v) === reach ? Math.sign(v) : 0,
            ) as unknown as Vec3
            const n = sorted.map((st) => (st.color === upColor ? up : out))
            return Math.sign(det(s, n[0]!, n[1]!)) === own
          })!
          return [key(w.position), key(target)]
        }),
      )
    }
  return { colorsOf, homesFor }
}

/** A step placing a kind by 3-cycles. */
export const byCycles =
  (
    table: () => ReadonlyMap<string, Move[]>,
    homeOf: (state: Cube) => ReadonlyMap<string, string>,
  ) =>
  (cube: Cube): Move[] =>
    placeByCycles(cube, table(), homeOf)

/** Whether every piece of a kind is where `homeOf` wants it. */
export const placed = (homeOf: (state: Cube) => ReadonlyMap<string, string>) => (cube: Cube) =>
  [...homeOf(cube)].every(([at, to]) => at === to)

/** A plan read on a projection (the tower a big one has become), its moves
 *  played as they are. */
export function projected(plan: MethodPlan, project: (cube: Cube) => Cube): MethodPlan {
  return plan.map((spec) => ({
    ...spec,
    goal: (cube: Cube) => spec.goal(project(cube)),
    phases: spec.phases.map((phase) => (cube: Cube) => phase(project(cube))),
  }))
}

/** Lazily built, once. */
export function once<T>(build: () => T): () => T {
  let value: T | undefined
  return () => (value ??= build())
}

/** Whether a permutation of slots (each to where its piece goes) is odd. */
export function isOdd(home: ReadonlyMap<string, string>): boolean {
  const seen = new Set<string>()
  let odd = 0
  for (const start of home.keys()) {
    for (let at = start; !seen.has(at); at = home.get(at)!) {
      seen.add(at)
      odd ^= at === start ? 0 : 1
    }
  }
  return odd === 1
}

/** Where each piece of a kind goes, its pieces all unlike (its solved
 *  slot, found by its colors). */
export function homesByColors(shape: CubeShape, isKind: (c: Cubie) => boolean) {
  const colors = (c: Cubie) =>
    c.stickers
      .map((s) => s.color)
      .sort()
      .join('')
  const homes = new Map(
    solvedCube(shape)
      .filter(isKind)
      .map((c) => [colors(c), key(c.position)]),
  )
  return (state: Cube): Map<string, string> =>
    new Map(state.filter(isKind).map((c) => [key(c.position), homes.get(colors(c))!]))
}

/** Where each two-sticker piece goes, twins told apart by handedness (a
 *  4x4x3's wings): its solved slot. */
export function homesByHand(shape: CubeShape, isKind: (c: Cubie) => boolean) {
  const id = (c: Cubie) =>
    `${c.stickers
      .map((s) => s.color)
      .sort()
      .join('')}${handOf(c)}`
  const homes = new Map(
    solvedCube(shape)
      .filter(isKind)
      .map((c) => [id(c), key(c.position)]),
  )
  return (state: Cube): Map<string, string> =>
    new Map(state.filter(isKind).map((c) => [key(c.position), homes.get(id(c))!]))
}

/** Whether the pieces of a kind stand an odd permutation away from where
 *  `homeOf` wants them, block by block (`blocksOf`): some block's. */
export function oddBlocks(
  homeOf: (state: Cube) => ReadonlyMap<string, string>,
  table: () => ReadonlyMap<string, readonly Move[]>,
) {
  const blocks = once(() => blocksOf(table()))
  return (state: Cube): boolean => {
    const home = homeOf(state)
    const odd = new Map<string, number>()
    const seen = new Set<string>()
    for (const start of home.keys()) {
      let length = 0
      for (let at = start; !seen.has(at); at = home.get(at)!) {
        seen.add(at)
        length++
      }
      if (length) {
        const block = blocks().get(start)!
        odd.set(block, ((odd.get(block) ?? 0) + length - 1) % 2)
      }
    }
    return [...odd.values()].some((v) => v === 1)
  }
}
