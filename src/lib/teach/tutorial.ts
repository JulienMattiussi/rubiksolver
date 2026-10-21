import type { Hold, HoldFrame } from '../core/hold'
import type { Color, Cube, Cubie, Sticker, Turn, Vec3 } from '../core/types'
import type { CubeVariant } from '../core/shapes'

/**
 * The tutorial: a puzzle solved a step at a time by the user, each step a
 * formula moving a few pieces where they go. A tutorial says which step
 * comes, suggests a piece and where it goes, and works out the formula for
 * whichever piece and place the user picks instead; the scene then shows
 * what the formula does to every piece (scene.ts). A tutorial is declared
 * (kit.ts), one per puzzle and method (lib/tutorials/registry.ts); this
 * module holds what they share. Nothing here knows a cube: turns are any
 * puzzle's, sides are outward normals, holds come from the tutorial's
 * frame.
 */

/** A piece picked (its index in the puzzle, stable from turn to turn) and
 *  where it should go (a slot: the position it should stand at). */
export interface TutorialPick {
  readonly piece: number
  readonly slot: Vec3
}

/** A sequence learnt, as its gestures: pieces each doing one thing (the
 *  middle edges' insertion: out of the way, then back), shown apart. */
export type Sequence = readonly (readonly Turn[])[]

/** A stage as the reminder shows it: its key and the formulas it teaches,
 *  whole (none: a stage solved by hand). */
export interface RecapStage {
  readonly key: string
  readonly formulas: readonly (readonly Turn[])[]
}

/**
 * What a step is: pieces placed one at a time, a picked one (`pieces`); a
 * formula of its own, no pick (`formula`); a figure recognized, no pick
 * (`figure`); a stage the puzzle already meets, shown in passing, nothing
 * to play (`alreadyDone`); a stage not taught yet (`toCome`); a word the
 * tutorial uses, shown on the puzzle before its stages (`term`); its
 * pieces' legend, shown after its words (`legend`).
 */
type StepKind = 'pieces' | 'formula' | 'figure' | 'alreadyDone' | 'toCome' | 'term' | 'legend'

/** A word a tutorial uses (an edge, a thin face), shown first: the pieces
 *  it names, lit, and where to look at them from. */
export interface Term {
  /** Its name (a key of the glossary's texts). */
  readonly key: string
  readonly pieces: (cube: Cube) => number[]
  /** Where the view looks from (none: where it is). */
  readonly from?: (cube: Cube) => Vec3 | null
  /** Only on this rendering (a thickness: on a mirror cube). */
  readonly only?: CubeVariant
  /** A turn shown playing (a way of turning: clockwise). */
  readonly demo?: Turn
  /** Only this part of its pieces lit, their other parts as the pieces it
   *  does not name (a Gear Cube's edges: its `gear`, or its `clips`). */
  readonly part?: string
}

/** A puzzle whose pieces are told by their shape, not their colors (the
 * Floppy Ghost, all silver): each piece named by a label (a letter, a
 * number), and shown in pictures (its front and its back), in a legend
 * after the words and beside its name in the instructions. */
export interface Legend {
  /** Each piece's label, by its index in the solved puzzle, in the
   *  legend's order. */
  readonly labels: readonly { readonly piece: number; readonly label: string }[]
  /** A piece's index in the solved puzzle, wherever it stands and however
   *  the state orders its pieces (an entered one, its own way). */
  readonly identify: (cubie: Cubie) => number
  /** Whether a piece shows its back (turned over): pictured so. */
  readonly turned: (cubie: Cubie) => boolean
  /** The piece that tells how to hold the puzzle when no color can, read
   *  on the state (the one at a given place: its picture, as it shows now,
   *  says which way up and which side). */
  readonly anchor?: (cube: Cube) => number
}

/** Where the tutorial stands on a state: its step, what it suggests. */
export interface TutorialStep {
  readonly kind: StepKind
  /** The step's name (a key of the tutorial's texts and steps' names). */
  readonly key: string
  /** Its rank among the method's stages (none: a step before them, the
   *  3x3's centers put back). */
  readonly stage?: number
  /** How far the stage has come: its pieces placed, of how many. */
  readonly progress?: { readonly done: number; readonly total: number }
  /** The way to hold the puzzle for a pick (one of the tutorial's frame):
   *  its formula's letters read from there, the same formula for every
   *  slot (the corners' `R U R' U'`, their slot front right). */
  readonly hold: (pick: TutorialPick | null) => Hold
  /** The color of the sticker that tells where a piece goes (the cross's
   *  yellow): the arrow follows it. */
  readonly marker?: Color
  /** The pieces already placed, which the step's formulas keep. */
  readonly placed: readonly number[]
  /** The piece suggested and its place (null: no pick). */
  readonly suggestion: TutorialPick | null
  /** The pieces one may pick, and where a piece may go. */
  readonly pickable: readonly number[]
  readonly slots: (piece: number) => readonly Vec3[]
  /** The formula moving the pick where it goes, keeping the placed pieces
   *  (null: none found, or nothing to play). */
  readonly formula: (pick: TutorialPick | null) => Turn[] | null
  /** The sequences its formulas use, read in its hold, each in the
   *  gestures it is learnt as (shown so). */
  readonly algorithms?: readonly Sequence[]
  /** A figure step's figure (a key of the tutorial's texts). */
  readonly figure?: string
  /** The pieces to work on when no arrow says which (the corners to turn
   *  in place), highlighted. */
  readonly focus?: readonly number[]
  /** How far the stage will have come once its formula played (from where
   *  it began): what to check then. */
  readonly outcome?: { readonly done: number; readonly total: number }
  /** The pieces a figure step works on: those its formula moves keep their
   *  colors, an arrow each to where it goes. */
  readonly subjects?: readonly number[]
  /** The side the step works on (its outward normal; the last layer's:
   *  the top): its subjects' arrows go from face to face there (those
   *  following the marker only when it comes there), and the view looks at
   *  it. */
  readonly side?: Vec3
  /** On a word of the glossary: a turn shown playing, and the part of its
   *  pieces lit (see `Term.part`). */
  readonly demo?: Turn
  readonly part?: string
  /** The side its stage finishes (its outward normal: a cross, a face),
   *  shown once the formula ending the stage is played. */
  readonly shows?: Vec3
  /** Whether its moves one by one keep their words beside them (the first
   *  steps, the letters being learnt); else they show in a row, their
   *  words in tooltips, but for those not shown yet. */
  readonly words?: true
}

/** A tutorial: the step a state stands at, or null once it is over. While
 *  a step is under way (turns by hand since it began, at `begun`), the step
 *  and the pieces it keeps are read where it began, and its formula works
 *  from `cube`, bringing them all back: a turn by hand that moves a placed
 *  piece does not take it off the list. */
export interface Tutorial {
  readonly stepOf: (cube: Cube, begun?: Cube) => TutorialStep | null
  /** The ways to hold the puzzle its steps use (its formulas read so). */
  readonly frame: HoldFrame
  /** How many stages it has, to the last (the one to come counted), and
   *  each one's key (the first stage's first). */
  readonly stages: number
  readonly stageKeys: readonly string[]
  /** Its stages taught and their formulas, for the reminder (the end, the
   *  « Aide-mémoire »). */
  readonly recap: readonly RecapStage[]
  /** The steps it plays before its stages, in order (the 3x3's: the cube
   *  held its way, then the centers put back): their keys. */
  readonly openings: readonly string[]
  /** The color of the side of this outward normal, and whether a center
   *  shows it (the 3x3's) or the pieces' frame only (a 2x2's, from its
   *  anchor corner): what the user is told to hold in front. */
  readonly faceColor: (cube: Cube, normal: Vec3) => { color: Color; center: boolean } | null
  /** The words it uses, shown before its stages (step 0). */
  readonly glossary: readonly Term[]
  /** What kind of piece a piece is, its name's key (a cube's by its
   *  stickers: center, edge, corner; a Pyraminx's tips told apart). */
  readonly pieceKind: (cubie: Cubie) => string
  /** The stickers naming a piece, when not all of them (a super cube's
   *  centers' borders aside). */
  readonly outside?: (cubie: Cubie) => readonly Sticker[]
  /** Its own way to say how to hold the puzzle (a text's key: the
   *  Pyraminx laid flat); none: by the center in front, or the side. */
  readonly holding?: string
  /** Its pieces named and pictured, when their colors do not tell them. */
  readonly legend?: Legend
}

/** A word of the glossary, shown before the stages (step 0): its pieces
 *  lit, `index` of `count`. */
export const termStep = (
  tutorial: Tutorial,
  term: Term,
  index: number,
  count: number,
  cube: Cube,
): TutorialStep => ({
  kind: 'term',
  key: term.key,
  stage: 0,
  progress: { done: index + 1, total: count },
  hold: () => tutorial.frame.holds[0]!,
  focus: term.pieces(cube),
  ...(term.demo && { demo: term.demo }),
  ...(term.part && { part: term.part }),
  placed: [],
  suggestion: null,
  pickable: [],
  slots: () => [],
  formula: () => null,
})

/** The legend's page, after the words (`count`: the words and it). */
export const legendStep = (tutorial: Tutorial, count: number): TutorialStep => ({
  kind: 'legend',
  key: 'legend',
  stage: 0,
  progress: { done: count, total: count },
  hold: () => tutorial.frame.holds[0]!,
  placed: [],
  suggestion: null,
  pickable: [],
  slots: () => [],
  formula: () => null,
})

/** A stage the puzzle already meets when the tutorial comes to it: shown
 *  all the same, held the usual way, nothing to play. */
export const alreadyDoneStep = (tutorial: Tutorial, stage: number): TutorialStep => ({
  kind: 'alreadyDone',
  key: tutorial.stageKeys[stage - 1]!,
  stage,
  hold: () => tutorial.frame.holds[0]!,
  placed: [],
  suggestion: null,
  pickable: [],
  slots: () => [],
  formula: () => [],
})
