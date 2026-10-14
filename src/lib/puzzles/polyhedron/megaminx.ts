import type { FaceLabels } from '../../core/moves'
import type { Color, Cube, Cubie, MegaFace, MegaMove, Vec3 } from '../../core/types'

/**
 * The Megaminx (fan2cube.fr/megaminx1): a dodecahedron whose twelve faces
 * turn by fifths of a turn, its centers fixed, 30 edges and 20 corners
 * between them. No integer grid fits it, so the model is combinatorial: a
 * slot is the set of faces it touches (a center one, an edge two, a corner
 * three), a sticker faces one of the twelve faces. A face's turn moves the
 * faces around it one step on (clockwise seen from it), which maps every
 * slot and sticker of its layer: a permutation, exact.
 *
 * The model still speaks the cubes' terms (cube.ts): a slot is named by an
 * integer position (its number, which says nothing of where it is), a face
 * by a normal of the cubes' table (geometry.ts: the six of the cube, then
 * the star prisms' six, mere labels here).
 */

export const MEGA_FACES: readonly MegaFace[] = [
  'U',
  'F',
  'R',
  'BR',
  'BL',
  'L',
  'DR',
  'DBR',
  'B',
  'DBL',
  'DL',
  'D',
]

/** The faces around each, clockwise seen from it. */
const AROUND: Record<MegaFace, readonly MegaFace[]> = {
  U: ['F', 'L', 'BL', 'BR', 'R'],
  F: ['U', 'R', 'DR', 'DL', 'L'],
  R: ['U', 'BR', 'DBR', 'DR', 'F'],
  BR: ['U', 'BL', 'B', 'DBR', 'R'],
  BL: ['U', 'L', 'DBL', 'B', 'BR'],
  L: ['U', 'F', 'DL', 'DBL', 'BL'],
  DR: ['F', 'R', 'DBR', 'D', 'DL'],
  DBR: ['R', 'BR', 'B', 'D', 'DR'],
  B: ['BR', 'BL', 'DBL', 'D', 'DBR'],
  DBL: ['L', 'DL', 'D', 'B', 'BL'],
  DL: ['F', 'DR', 'D', 'DBL', 'L'],
  D: ['DR', 'DL', 'DBL', 'B', 'DBR'],
}

/** The faces around one, clockwise seen from it. */
export const megaAround = (face: MegaFace): readonly MegaFace[] => AROUND[face]

/** Each face's label among the cubes' normals. */
const LABEL: Record<MegaFace, Vec3> = {
  U: [0, 1, 0],
  F: [0, 0, 1],
  R: [1, 0, 0],
  BR: [2, 0, -1],
  BL: [1, 0, -2],
  L: [-1, 0, 0],
  DR: [-1, 0, -1],
  DBR: [-2, 0, 1],
  B: [0, 0, -1],
  DBL: [-1, 0, 2],
  DL: [1, 0, 1],
  D: [0, -1, 0],
}
const FACE_OF = new Map(MEGA_FACES.map((f) => [LABEL[f].join(), f]))

/** The normal standing for a face. */
export const megaNormal = (face: MegaFace): Vec3 => LABEL[face]

/** The face a sticker's normal stands for. */
export const megaFaceOf = (normal: Vec3): MegaFace => FACE_OF.get(normal.join())!

/** Each face's color. */
const COLOR: Record<MegaFace, Color> = {
  U: 'W',
  F: 'G',
  R: 'R',
  BR: 'B',
  BL: 'P',
  L: 'V',
  DR: 'L',
  DBR: 'O',
  B: 'T',
  DBL: 'M',
  DL: 'N',
  D: 'Y',
}

const keyOf = (faces: readonly MegaFace[]) => [...faces].sort().join()

/** Every slot, as the faces it touches: centers, edges, corners. */
export const MEGA_SLOTS: readonly (readonly MegaFace[])[] = (() => {
  const edges = new Map<string, MegaFace[]>()
  const corners = new Map<string, MegaFace[]>()
  for (const f of MEGA_FACES) {
    const around = AROUND[f]
    around.forEach((g, i) => {
      edges.set(keyOf([f, g]), [f, g])
      const h = around[(i + 1) % 5]!
      corners.set(keyOf([f, g, h]), [f, g, h])
    })
  }
  return [...MEGA_FACES.map((f) => [f]), ...edges.values(), ...corners.values()]
})()

/** A slot's number as a position within +-4 (base 9). */
const positionOf = (index: number): Vec3 => [(index % 9) - 4, (Math.floor(index / 9) % 9) - 4, -4]
const SLOT_INDEX = new Map(MEGA_SLOTS.map((faces, i) => [keyOf(faces), i]))
const SLOT_AT = new Map(MEGA_SLOTS.map((faces, i) => [positionOf(i).join(), faces]))

/** The faces a slot touches, from its position. */
export const megaSlotAt = (position: Vec3): readonly MegaFace[] => SLOT_AT.get(position.join())!

/** The position of the slot touching these faces. */
export const megaPosition = (faces: readonly MegaFace[]): Vec3 =>
  positionOf(SLOT_INDEX.get(keyOf(faces))!)

/** The solved Megaminx: every piece home, each face its color. */
export function solvedMegaminx(): Cube {
  return MEGA_SLOTS.map((faces) => ({
    position: megaPosition(faces),
    stickers: faces.map((f) => ({ normal: LABEL[f], color: COLOR[f] })),
  }))
}

/** Where a face goes as a face turns some fifths clockwise. */
function carried(move: MegaMove): (face: MegaFace) => MegaFace {
  const around = AROUND[move.megaFace]
  return (face) => {
    const i = around.indexOf(face)
    return i < 0 ? face : around[(i + move.amount) % 5]!
  }
}

/** Whether a turn moves the piece at a position: its slot touches the face
 *  (on the Pyraminx Crystal, an edge also when it leaves one of the face's
 *  corners: its two faces are next to each other around it). */
export function megaTurns(move: MegaMove, position: Vec3): boolean {
  const slot = SLOT_AT.get(position.join())
  if (!slot) return false // the Crystal's core
  if (slot.includes(move.megaFace)) return true
  if (!move.crystal || slot.length !== 2) return false
  const around = AROUND[move.megaFace]
  const [i, j] = slot.map((f) => around.indexOf(f))
  return i! >= 0 && j! >= 0 && ((i! - j! + 5) % 5 === 1 || (j! - i! + 5) % 5 === 1)
}

/** A face turned: every piece of its layer one step on per fifth. */
export function applyMegaMove(cube: Cube, move: MegaMove): Cube {
  const to = carried(move)
  return cube.map((c): Cubie => {
    if (!megaTurns(move, c.position)) return c
    const slot = megaSlotAt(c.position)
    return {
      position: megaPosition(slot.map(to)),
      stickers: c.stickers.map((s) => ({
        normal: LABEL[to(megaFaceOf(s.normal))],
        color: s.color,
      })),
    }
  })
}

/** Each face's outward direction in the 3D view: for the animation and
 *  the drawing only, never the model. The top, then two rings of five
 *  (azimuths from the front, clockwise seen from above as they decrease),
 *  the bottom. */
export const MEGA_AXES: Record<MegaFace, readonly [number, number, number]> = (() => {
  const h = 1 / Math.sqrt(5)
  const r = 2 / Math.sqrt(5)
  const at = (deg: number, y: number) =>
    [r * Math.sin((deg * Math.PI) / 180), y, r * Math.cos((deg * Math.PI) / 180)] as const
  return {
    U: [0, 1, 0],
    F: at(0, h),
    L: at(-72, h),
    BL: at(-144, h),
    BR: at(144, h),
    R: at(72, h),
    DR: at(36, -h),
    DBR: at(108, -h),
    B: at(180, -h),
    DBL: at(-108, -h),
    DL: at(-36, -h),
    D: [0, -1, 0],
  }
})()

/** The animation of a turn: about its face's axis, clockwise seen from it. */
export function megaRotation(move: MegaMove) {
  const fifths = move.amount <= 2 ? -move.amount : 5 - move.amount
  return { axis: MEGA_AXES[move.megaFace], angle: (fifths * 2 * Math.PI) / 5 }
}

/** The puzzle turned as a whole, so these faces go where these others
 *  were: one fifth about U, one about F (they make the 60 ways to hold it). */
function wholeTurn(about: 'U' | 'F'): (face: MegaFace) => MegaFace {
  const turn = carried({ megaFace: about, amount: 1 })
  const opposite = OPPOSITE[about]
  // The far ring turns as the near one, its faces opposite theirs.
  return (face) => {
    if (AROUND[about].includes(face) || face === about) return turn(face)
    if (face === opposite) return face
    return OPPOSITE[turn(OPPOSITE[face])]
  }
}

const OPPOSITE: Record<MegaFace, MegaFace> = {
  U: 'D',
  D: 'U',
  F: 'B',
  B: 'F',
  R: 'DBL',
  DBL: 'R',
  L: 'DBR',
  DBR: 'L',
  BR: 'DL',
  DL: 'BR',
  BL: 'DR',
  DR: 'BL',
}

/** The Megaminx turned as a whole: its whole-puzzle turns' generators. */
export const MEGA_SYMMETRIES: readonly ((cube: Cube) => Cube)[] = (['U', 'F'] as const).map(
  (about) => {
    const to = wholeTurn(about)
    return (cube: Cube) =>
      cube.map((c) =>
        // The Crystal's core stays where it is.
        !SLOT_AT.has(c.position.join())
          ? c
          : {
              position: megaPosition(megaSlotAt(c.position).map(to)),
              stickers: c.stickers.map((s) => ({
                normal: LABEL[to(megaFaceOf(s.normal))],
                color: s.color,
              })),
            },
      )
  },
)

/** Every turn: each face, a fifth or two either way. */
export const MEGA_TURNS: readonly MegaMove[] = MEGA_FACES.flatMap((megaFace) =>
  ([1, 4, 2, 3] as const).map((amount): MegaMove => ({ megaFace, amount })),
)

export const invertMegaMove = (move: MegaMove): MegaMove => ({
  ...move,
  amount: (5 - move.amount) as MegaMove['amount'],
})

export function simplifyMegaMoves(moves: readonly MegaMove[]): MegaMove[] {
  const out: MegaMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last?.megaFace === move.megaFace) {
      out.pop()
      const total = (last.amount + move.amount) % 5
      if (total !== 0) out.push({ ...move, amount: total as MegaMove['amount'] })
    } else out.push(move)
  }
  return out
}

/** Every Pyraminx Crystal turn. */
export const CRYSTAL_TURNS: readonly MegaMove[] = MEGA_TURNS.map((m) => ({ ...m, crystal: true }))

/** The Pyraminx Crystal: the Megaminx's edges and corners, about a hidden
 *  core (which tells it from the Holey Megaminx). */
export const solvedCrystal = (): Cube => [
  ...solvedMegaminx().filter((c) => c.stickers.length > 1),
  { position: positionOf(MEGA_SLOTS.length), stickers: [] },
]

/** Random turns, never the same face twice in a row. */
export function scrambleMegaminx(length: number, rng: () => number, crystal = false): MegaMove[] {
  const turns = crystal ? CRYSTAL_TURNS : MEGA_TURNS
  const out: MegaMove[] = []
  while (out.length < length) {
    const move = turns[Math.floor(rng() * turns.length)]!
    if (move.megaFace !== out[out.length - 1]?.megaFace) out.push(move)
  }
  return out
}

/** fan2cube's letters, the puzzle held with A in front and H above it:
 *  around A clockwise H, D, B, P (underlined), G; the others opposite
 *  them, underlined (a combining low line). */
const UNDER = '̲'
const FR: Record<MegaFace, string> = {
  U: 'H',
  F: 'A',
  R: 'D',
  L: 'G',
  BR: 'P',
  BL: `B${UNDER}`,
  DR: 'B',
  DL: `P${UNDER}`,
  DBL: `D${UNDER}`,
  DBR: `G${UNDER}`,
  B: `A${UNDER}`,
  D: `H${UNDER}`,
}

const SUFFIX = { 1: '', 2: '2', 3: "2'", 4: "'" } as const

export function formatMegaMove(move: MegaMove, labels: FaceLabels): string {
  return (labels.U === 'U' ? move.megaFace : FR[move.megaFace]) + SUFFIX[move.amount]
}
