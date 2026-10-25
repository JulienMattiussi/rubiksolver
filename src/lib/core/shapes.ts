/**
 * The puzzles, as their catalog cards say (lib/puzzles/<category>/catalog.ts):
 * their ids (`CubeShape`), every table read on the cards (dimensions,
 * names, moves, pads...), their variants and the picker's choices. Pure
 * data, zero React / three.js; the engine's own types are in types.ts.
 */

import { CATALOG, CATEGORY_OF } from '../puzzles/catalog'
import type { EditHint, MoveFamily, PadKind, PuzzleEntry, ScanUnseen } from '../puzzles/entry'
import type { Color, Dims, Face } from './types'

/** The puzzles the app can build, by id (also the picker's option values):
 *  the keys of the catalog (puzzles/catalog.ts). */
export type CubeShape = keyof typeof CATALOG

/** A value per puzzle, read on its catalog card. */
const each = <T>(read: (entry: PuzzleEntry) => T): Record<CubeShape, T> =>
  Object.fromEntries(
    Object.entries(CATALOG).map(([shape, entry]) => [shape, read(entry)]),
  ) as Record<CubeShape, T>

/**
 * Layer counts per shape: the NxNxN cubes, the 1x2x3 flat cuboid (3 wide, 2
 * tall, 1 thick, so the rectangle you face is its 3x2 side), the 2x2x4
 * tower (4 layers on a square 2x2 section), its slim 2x2x3 cousin, the Domino (a 3x3 two layers
 * tall: U and D turn freely, its sides only take half turns) and the Floppy
 * (a 3x3 one layer tall: half turns of its sides only). The other puzzles
 * follow, each with the box its pieces sit in (see their comments).
 *
 * A one-layer axis has no move of its own: turning its only layer just turns
 * the whole puzzle. Which turns exist beyond that follows from these counts,
 * see `movesFor` in moves.ts.
 */
export const SHAPE_DIMS: Record<CubeShape, Dims> = each((e) => e.dims)

/** Each puzzle's own kind of moves (none: a grid's face layers). */
const SHAPE_MOVES: Record<CubeShape, MoveFamily | undefined> = each((e) => e.moves)

/** The puzzles turning by a family's moves, read on their cards. */
type Moving<F extends MoveFamily> = {
  [S in CubeShape]: (typeof CATALOG)[S] extends { readonly moves: F } ? S : never
}[CubeShape]

/** The star prisms: 2 or 4 layers. */
export type StarShape = Moving<'star'>

/** Whether a shape is a star prism, which turns by rings and slash (star.ts)
 *  rather than by face layers. */
export const isStar = (shape: CubeShape): shape is StarShape => SHAPE_MOVES[shape] === 'star'

/** The Pyraminx, the Master Pyraminx (its 4x4 version) and the Pyraminx
 *  Jing (its deep-cut cousin), the Tetraminx and the Professor. */
export type PyraShape = Moving<'pyra'>

/** Whether a shape is a Pyraminx, which turns about its corners (pyraminx.ts). */
export const isPyraminx = (shape: CubeShape): shape is PyraShape => SHAPE_MOVES[shape] === 'pyra'

/** The Gear Cubes (gear.ts): a 3x3x3's cubies, turned by gear moves. */
export const isGear = (shape: CubeShape): boolean => SHAPE_MOVES[shape] === 'gear'

/** Whether a Gear Cube's clips bear colors (the Ultimate, the Extreme):
 *  then they turn over apart from their gears, which the plain Gear Cube
 *  does not show. */
const SHAPE_CLIPS: Record<CubeShape, boolean> = each((e) => !!e.coloredClips)
export const hasColoredClips = (shape: CubeShape): boolean => SHAPE_CLIPS[shape]

const SHAPE_COVER: Record<CubeShape, boolean> = each((e) => !!e.cover)
/** Whether a puzzle is shown in front of its category's tile. */
export const isCover = (shape: CubeShape): boolean => SHAPE_COVER[shape]

/** Whether a shape builds and turns in its own module rather than on a grid
 *  of layers (any with its own kind of moves): drawn from polygons, turned
 *  by its own pad. */
export const isGridless = (shape: CubeShape): boolean => SHAPE_MOVES[shape] !== undefined

/**
 * Shapes that leave their box: their mechanism is a bigger cube with pieces
 * missing, so they turn like that cube and come out bumpy. The 2x2x4 tower
 * turns like a 4x4x4 (`turnDims`): its wide turns (Rw: half the puzzle) always
 * go, an outer turn (R) only when its end is a complete layer (`turnAllowed`).
 * A property of the real puzzle's core, not of its dimensions: a 1x3x3 Floppy
 * forbids such turns where its Super Floppy cousin allows them. The
 * Pyramorphinx shifts too, inside its box: its pieces differ in shape, so a
 * big one where a small one belongs changes its form. Such a puzzle is
 * entered in the form it stands in (forms.ts).
 */
export const SHAPE_SHIFTS: Record<CubeShape, boolean> = each((e) => e.shifts === true)

/**
 * Inner layers a puzzle's mechanism turns besides its outer faces, on every
 * axis of 3 layers or more: the 4x4 its inner slices (2R) and wide turns
 * (Rw); the tower only its wide turns (a slice is a wide then an outer turn
 * there, rarely useful); the slim tower its wide turns (Uw: the top block,
 * fan2cube's H*); the 4-Trajber's Octahedron its slices only (a wide turn
 * there turns four whole faces: the puzzle stays solved). Like
 * SHAPE_SHIFTS, a property of the real puzzle.
 */
/** An inner layer kind: the slice next to the face (2R), the third layer in
 *  (3R, a 6x6's), the face with the next one (Rw) or the next two (3Rw). */
export type InnerTurn = 'slice' | 'wide' | 'slice3' | 'wide3'

export const SHAPE_INNER_TURNS: Record<CubeShape, readonly InnerTurn[]> = each((e) => e.inner ?? [])

/**
 * Turns a puzzle takes beyond its everyday ones, offered apart (the pad's
 * "advanced" tab) and never scrambled with: the 3x3's middle slices (M, E, S)
 * and wide turns (Rw), which the solutions of some methods use (Roux).
 */
export const SHAPE_ADVANCED_TURNS: Record<CubeShape, readonly ('slice' | 'wide')[]> = each(
  (e) => e.advanced ?? [],
)

/** Name of each shape in the picker (identical in every language). */
export const SHAPE_LABEL: Record<CubeShape, string> = each((e) => e.label)

/** Name of each shape in the address (`#/fr/floppy-ghost`, see route.ts):
 *  the same in every language, so a link works whatever the reader's. */
export const SHAPE_SLUG: Record<CubeShape, string> = each((e) => e.slug)

/** Turns in a scramble of each shape. */
export const SHAPE_SCRAMBLE: Record<CubeShape, number> = each((e) => e.scramble)

/** A shape's colors where its real puzzle differs from the standard scheme
 *  (the 2x2x4 tower is sold blue below, yellow behind). */
export const SHAPE_SCHEME: Record<CubeShape, Partial<Record<Face, Color>>> = each(
  (e) => e.scheme ?? {},
)

/** The pad of turns each shape shows. */
export const SHAPE_PAD: Record<CubeShape, PadKind> = each((e) => e.pad ?? 'faces')

/** The editor's hint for each shape, when not the usual one. */
export const SHAPE_EDIT_HINT: Record<CubeShape, EditHint | undefined> = each((e) => e.editHint)

/** Shapes whose camera scan was tried on the real puzzle (lib/editor/scan/):
 *  the others' button says it is untried yet. */
export const SHAPE_SCAN_TRIED: Record<CubeShape, boolean> = each((e) => e.scanTried === true)

/** What each shape's camera scan cannot see, to check after it. */
export const SHAPE_SCAN_UNSEEN: Record<CubeShape, ScanUnseen | undefined> = each(
  (e) => e.scanUnseen,
)

/** Shapes whose mirror scans by its stickers' sizes (sizedRead.ts). */
export const SHAPE_MIRROR_SCAN: Record<CubeShape, boolean> = each((e) => e.mirrorScan === true)

/** Shapes exposed in the UI, in display order. */
const SHAPES = Object.keys(CATALOG) as readonly CubeShape[]

/**
 * How a cube is rendered. Purely visual: the engine, the solvers and the
 * editor never look at it. `mirror` is the shape mod (Mirror Blocks): every
 * facelet is the same color and the layers have different thicknesses, so the
 * pieces are told apart by their size (see `lib/core/shape.ts`).
 */
export type CubeVariant = 'classic' | 'mirror'

/**
 * Shapes sold as a mirror puzzle. Only real puzzles are offered: the 2x2x4 has
 * no mirror version, and the 1x2x3 cannot have one (a one-layer axis puts two
 * opposite stickers on the same piece, so its faces carry no thickness).
 */
const SHAPE_MIRROR: Record<CubeShape, boolean> = each((e) => e.mirror === true)

export function supportsMirror(shape: CubeShape): boolean {
  return SHAPE_MIRROR[shape]
}

/** One entry of the cube picker: a shape plus a rendering variant. */
export interface CubeKind {
  readonly shape: CubeShape
  readonly variant: CubeVariant
}

/** Groups of the cube picker, in display order: the classic NxNxN cubes, their
 *  mirror versions, the other cuboids (towers, Domino), the flat puzzles (one
 *  layer thick: 1x2x3, Floppy, Floppy Ghost), the pyramids, the polyhedra,
 *  the round ones, the gear cubes, the diagonal cuts, the holey ones, the
 *  twisted ones, then the bandaged ones. Each but the mirrors is a folder of lib/puzzles. */
export const CUBE_CATEGORIES = [
  'standard',
  'mirror',
  'tower',
  'flat',
  'pyramid',
  'polyhedron',
  'round',
  'gear',
  'diagonal',
  'holey',
  'twisted',
  'bandaged',
] as const
export type CubeCategory = (typeof CUBE_CATEGORIES)[number]

/** Picker group of a cube choice: its catalog folder's, or its variant's
 *  own (the mirrors'). */
export function cubeCategory({ shape, variant }: CubeKind): CubeCategory {
  return variant === 'classic' ? CATEGORY_OF[shape] : variant
}

/** Cube choices exposed in the UI (the picker groups them by `cubeCategory`). */
export const CUBE_KINDS: readonly CubeKind[] = [
  ...SHAPES.map((shape): CubeKind => ({ shape, variant: 'classic' })),
  ...SHAPES.filter(supportsMirror).map((shape): CubeKind => ({ shape, variant: 'mirror' })),
]

/** What a variant adds to a cube choice's id (`4m`). */
const VARIANT_ID: Record<CubeVariant, string> = { classic: '', mirror: 'm' }

/** Stable id of a cube choice, used as the picker's option value. */
export function cubeKindId({ shape, variant }: CubeKind): string {
  return shape + VARIANT_ID[variant]
}

/** The home page's gallery: the puzzles whose card shows them there, each
 *  in its variant. */
const SHAPE_HOME: Record<CubeShape, CubeVariant | undefined> = each((e) => e.home)
export const HOME_KINDS: readonly CubeKind[] = SHAPES.flatMap((shape) => {
  const variant = SHAPE_HOME[shape]
  return variant ? [{ shape, variant }] : []
})
