import { normalIndex } from '../geometry'
import { applyMoves } from '../turn'
import type { Color, Cube, Cubie, PyraMove, Vec3 } from '../types'
import { undoAll } from './pyraKit'

/**
 * 3-cycles of one kind of piece on the big Pyraminxes (the Master's wings,
 * the Professor's wings, co-wings and co-centers), the brick of their
 * fan2cube methods: the page's formulas, from every side, each then set up
 * by a turn (undone after) until every 3-cycle of the kind is found, and a
 * step that places the pieces one at a time through slots still wrong.
 */

const key = (p: Vec3) => p.join()

/** Where a sequence sends each slot of the kind (`a` to `b`), from the
 *  solved puzzle; with `pure`, null when it also moves or twists a piece
 *  `mayMove` does not allow (the kinds a later step sees to). */
function effect(
  solved: Cube,
  sequence: readonly PyraMove[],
  isKind: (c: Cubie) => boolean,
  pure: boolean,
  mayMove: (c: Cubie) => boolean,
): Map<string, string> | null {
  const after = applyMoves(solved, sequence)
  const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')
  const map = new Map<string, string>()
  for (const [i, c] of solved.entries()) {
    if (isKind(c)) map.set(key(c.position), key(after[i]!.position))
    else if (pure && !mayMove(c) && pose(c) !== pose(after[i]!)) return null
  }
  return map
}

/** The key of the cycle a>b>c, starting from its smallest slot. */
function cycleId(a: string, b: string, c: string): string {
  const order = [a, b, c]
  const start = order.indexOf([...order].sort()[0]!)
  return [0, 1, 2].map((k) => order[(start + k) % 3]).join('>')
}

/** The id of a 3-cycle given by where it sends each slot, or null. */
function cycleOf(map: ReadonlyMap<string, string>): string | null {
  const moved = [...map].filter(([from, to]) => from !== to).map(([from]) => from)
  if (moved.length !== 3) return null
  const [a] = moved.sort() as [string]
  const b = map.get(a)!
  return cycleId(a, b, map.get(b)!)
}

/**
 * Every 3-cycle of a kind, keyed by what it does, `a>b>c` (the piece in
 * slot a goes to b, b's to c, c's to a): the given formulas (each already
 * from every side), then set up by turns (undone after), the shortest of
 * each kept. A turn s set before a cycle a>b>c makes it
 * s⁻¹(a)>s⁻¹(b)>s⁻¹(c): the cycles grow by conjugation until none is new.
 */
export function cycleTable(
  solved: Cube,
  isKind: (c: Cubie) => boolean,
  formulas: readonly (readonly PyraMove[])[],
  setups: readonly PyraMove[],
  mayMove: (c: Cubie) => boolean = () => false,
): Map<string, PyraMove[]> {
  const found = new Map<string, PyraMove[]>()
  for (const sequence of formulas) {
    const map = effect(solved, sequence, isKind, true, mayMove)
    const id = map && cycleOf(map)
    if (id && !found.has(id)) found.set(id, [...sequence])
  }
  // Each setup turn, as where it takes each slot back from.
  const backs = setups.map((turn) => {
    const ahead = effect(solved, [turn], isKind, false, mayMove)!
    return { turn, back: new Map([...ahead].map(([from, to]) => [to, from])) }
  })
  let frontier = [...found.keys()]
  while (frontier.length) {
    const next: string[] = []
    for (const id of frontier) {
      const slots = id.split('>')
      for (const { turn, back } of backs) {
        const moved = slots.map((slot) => back.get(slot)!)
        const conjugate = cycleId(moved[0]!, moved[1]!, moved[2]!)
        if (found.has(conjugate)) continue
        found.set(conjugate, [turn, ...found.get(id)!, ...undoAll([turn])])
        next.push(conjugate)
      }
    }
    frontier = next
  }
  return found
}

const det = (a: Vec3, b: Vec3, c: Vec3): number =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) -
  a[1] * (b[0] * c[2] - b[2] * c[0]) +
  a[2] * (b[0] * c[1] - b[1] * c[0])

/**
 * The slot a two-color piece belongs to (a wing, a co-wing): of the two
 * slots of its colors (twins), the one of its handedness. A turn keeps the
 * handedness of a piece's position and two sticker normals (a rotation
 * keeps the sign of their determinant); the twin slot has the opposite one.
 */
export function handedHome(piece: Cubie, slots: Cube, faces: Map<number, Color>): string {
  const [a, b] = piece.stickers as [Cubie['stickers'][0], Cubie['stickers'][0]]
  const own = Math.sign(det(piece.position, a.normal, b.normal))
  for (const slot of slots) {
    const normalOf = (color: Color) =>
      slot.stickers.find((s) => faces.get(normalIndex(s.normal)) === color)?.normal
    const [na, nb] = [normalOf(a.color), normalOf(b.color)]
    if (na && nb && Math.sign(det(slot.position, na, nb)) === own) return key(slot.position)
  }
  throw new Error('pyraminx: a piece belongs nowhere')
}

/**
 * Place every piece of a kind with 3-cycles from `table`, one at a time.
 * `homeOf` says, for each slot of the kind, the slot its piece belongs to
 * (itself when right). Each cycle takes a wrong slot's piece home through
 * another wrong slot, preferably the one holding the piece that belongs
 * there (two at once). Two left, swapped, which only pieces of one color
 * alike allow (the co-centers): through a right slot that ends right.
 */
export function placeByCycles(
  cube: Cube,
  table: ReadonlyMap<string, PyraMove[]>,
  homeOf: (state: Cube) => ReadonlyMap<string, string>,
): PyraMove[] {
  const moves: PyraMove[] = []
  let state = cube
  const wrongIn = (home: ReadonlyMap<string, string>) =>
    [...home].filter(([at, to]) => at !== to).map(([at]) => at)
  for (let guard = 0; ; guard++) {
    if (guard > 64) throw new Error('pyraminx: the pieces cannot be cycled into place')
    const home = homeOf(state)
    const wrong = wrongIn(home)
    if (wrong.length === 0) return moves
    const [a] = wrong as [string]
    const b = home.get(a)!
    const through = wrong
      .filter((c) => c !== a && c !== b)
      .sort((x, y) => Number(home.get(y) === a) - Number(home.get(x) === a))
      .map((c) => table.get(cycleId(a, b, c)))
      .find((sequence) => sequence !== undefined)
    const cycle =
      through ??
      [...home.keys()]
        .filter((c) => !wrong.includes(c))
        .map((c) => table.get(cycleId(a, b, c)))
        .find((sequence) => sequence && wrongIn(homeOf(applyMoves(state, sequence))).length === 0)
    if (!cycle) throw new Error('pyraminx: the pieces cannot be cycled into place')
    moves.push(...cycle)
    state = applyMoves(state, cycle)
  }
}
