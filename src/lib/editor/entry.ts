import type { Color, Cube, CubeShape, Cubie, Vec3 } from '../core/types'
import type { FaceEntry } from './modes/faceViews'
import { MODELS } from '../puzzles/models'

/**
 * How a puzzle is entered, as its model declares it (`PuzzleModel.entry`):
 * steps first, each a mode of entry (lib/editor/modes/), then its colors,
 * painted or put piece by piece. The editor (store, panels, views) runs
 * the steps a model lists, knowing the modes only, never a puzzle:
 *
 *   form     its form picked among thumbnails (modes/form.ts)
 *   canvas   its shape told face by face on canvases (modes/canvas.ts)
 *   cuts     its half-cubies laid, cell by cell (modes/cuts.ts)
 *   joints   its pieces fused, joint by joint (modes/joints.ts)
 *   toggles  something set by clicking pieces round (modes/toggles.ts)
 *
 * then the paint step: by colors (modes/colors.ts) or by pieces
 * (modes/pieces.ts), with toggles of its own, a way to paint several
 * stickers at once and parts painted apart, if it says so.
 */

/** A toggle's state, by key: how far round it is (none: 0). */
export type Toggles = Readonly<Record<string, number>>

/** Parts painted apart from the stickers, by sticker id (a Gear Cube's
 *  gears, apart from their clips). */
export type Parts = Readonly<Record<string, Color>>

/** Painted stickers, keyed by sticker id. Absent id = not yet painted. */
export type EditStickers = Record<string, Color>

/** A slot as a toggle reads it. */
export interface ToggleSlot {
  readonly key: string
  readonly position: Vec3
  readonly stickers: number
}

/** What clicks turn round (modes/toggles.ts): a RoadBlock-I's bars, a Gear
 *  Cube's gears' pivots, a Z-Twist's side centers. */
export interface TogglesSpec {
  /** The texts that name it (`t.toggles[name]`). */
  readonly name: 'bars' | 'gears' | 'centers'
  /** The key a click on a slot turns, if it turns one. */
  readonly keyAt: (slot: ToggleSlot) => string | null
  /** How many ways round a key goes (2: on and off). */
  readonly ways: number
  /** The keys turning with one (lit up and turned together). */
  readonly mates?: (key: string) => readonly string[]
  /** A state's, to enter it as it stands. */
  readonly of: (cube: Cube) => Toggles
  /** The colors entered once a key turned from `from` (a RoadBlock-I's
   *  bars keep theirs). */
  readonly carry?: (edit: EditStickers, key: string, from: number) => EditStickers
}

/** Half-cubies laid cell by cell (modes/cuts.ts): the Fashion-V's. */
export interface CutsSpec {
  /** As in the box. */
  readonly start: () => Cuts
  readonly of: (cube: Cube) => Cuts
  /** A cell clicked: its halves the next way round. */
  readonly next: (cuts: Cuts, cellKey: string) => Cuts
  /** The pieces as the cuts lay them, to be seen while entered, each with
   *  the cell a click on it goes round (none: it never moves). */
  readonly pieces: (cuts: Cuts) => readonly { readonly cubie: Cubie; readonly cell?: string }[]
  /** How many whole pieces the cuts make (the count shown). */
  readonly wholes: (cuts: Cuts) => number
  /** A state with these cuts, or null if none. */
  readonly form: (cuts: Cuts) => Cube | null
}

/** Per cell, how its halves lie. */
export type Cuts = Readonly<Record<string, number>>

/** Pieces fused joint by joint (modes/joints.ts): a bandaged puzzle whose
 *  blocks move. */
interface JointsSpec {
  /** Every form its blocks can stand in. */
  readonly forms: () => readonly Cube[]
}

/** Several stickers painted at once (a RoadBlock-I's bar): the paint of
 *  one sticker as the entry turns it into paints. */
export type PaintTogether = (
  paint: (edit: EditStickers, slotKey: string, keep?: ReadonlySet<string>) => EditStickers,
  edit: EditStickers,
  slotKey: string,
  ni: number,
  color: Color,
  toggles: Toggles,
) => EditStickers

/** Parts painted apart (a Gear Cube's gears). */
export interface PartsSpec {
  /** A part's face painted (`ni`), the stickers' colors known. */
  readonly paint: (
    parts: Parts,
    edit: EditStickers,
    slotKey: string,
    ni: number,
    color: Color,
  ) => Parts
  /** Parts the stickers now tell. */
  readonly complete: (parts: Parts, edit: EditStickers) => Parts
  /** Faces left by color, painted and all; parts done and all. */
  readonly count: (parts: Parts) => {
    readonly remaining: Partial<Record<Color, number>>
    readonly painted: number
    readonly total: number
    readonly done: number
    readonly pieces: number
  }
  /** A state's, to enter it as it stands. */
  readonly of: (cube: Cube) => Parts
}

export type EntryStep =
  | { readonly kind: 'form' }
  | { readonly kind: 'canvas'; readonly faces: FaceEntry; readonly later?: true }
  | { readonly kind: 'cuts'; readonly cuts: CutsSpec }
  | { readonly kind: 'joints'; readonly joints: JointsSpec }
  | { readonly kind: 'toggles'; readonly toggles: TogglesSpec }

export type StepKind = EntryStep['kind']

/** Its form picked first among thumbnails (modes/form.ts). */
export const PICK_FORM = (): readonly EntryStep[] => [{ kind: 'form' }]

/** Put piece by piece (modes/pieces.ts). */
export const BY_PIECES: PaintSpec = { by: 'pieces' }

/** The colors' step. */
export interface PaintSpec {
  /** Painted sticker by sticker (`colors`), or put piece by piece. */
  readonly by: 'colors' | 'pieces'
  /** Clicks turning pieces while painting (a Z-Twist's side centers). */
  readonly toggles?: TogglesSpec
  readonly together?: PaintTogether
  readonly parts?: PartsSpec
}

/** What an entry holds besides its colors, for the model to build its
 *  state from (`entry.built`). */
export interface EntryMarks {
  readonly toggles: Toggles
  readonly parts: Parts
}

export const NO_MARKS: EntryMarks = { toggles: {}, parts: {} }

/** A puzzle's entry, as declared. */
export interface Entry {
  readonly steps: readonly EntryStep[]
  readonly paint: PaintSpec
}

const PAINT_COLORS: PaintSpec = { by: 'colors' }
const ENTRIES = new Map<CubeShape, Entry>()

/** A puzzle's entry: its model's steps and paint, by default its colors
 *  alone. Read once, when first needed (a model's steps may be worked out
 *  from its solved state). */
export function entryOf(shape: CubeShape): Entry {
  let entry = ENTRIES.get(shape)
  if (!entry) {
    const own = MODELS[shape]?.entry
    entry = { steps: own?.steps?.() ?? [], paint: own?.paint ?? PAINT_COLORS }
    ENTRIES.set(shape, entry)
  }
  return entry
}

/** A puzzle's step of a kind, if it has one. */
export function stepOf<K extends StepKind>(
  shape: CubeShape,
  kind: K,
): Extract<EntryStep, { kind: K }> | undefined {
  return entryOf(shape).steps.find((s) => s.kind === kind) as
    Extract<EntryStep, { kind: K }> | undefined
}

/** The step an entry starts with: its first, unless offered later only
 *  (the Camouflage's faces, its box most often painted as it is). */
export function firstStepOf(shape: CubeShape): StepKind | 'paint' {
  const first = entryOf(shape).steps[0]
  return first && !('later' in first && first.later) ? first.kind : 'paint'
}

/** Whether a puzzle is put piece by piece rather than painted. */
export const entersByPieces = (shape: CubeShape): boolean => entryOf(shape).paint.by === 'pieces'

/** The toggles a slot's click turns while on `step` (a setup's, or the
 *  paint's own). */
export function togglesAt(shape: CubeShape, step: StepKind | 'paint'): TogglesSpec | undefined {
  if (step === 'paint') return entryOf(shape).paint.toggles
  return step === 'toggles' ? stepOf(shape, 'toggles')?.toggles : undefined
}

/** The toggles a puzzle's entry has, wherever they are. */
export const togglesOf = (shape: CubeShape): TogglesSpec | undefined =>
  stepOf(shape, 'toggles')?.toggles ?? entryOf(shape).paint.toggles
