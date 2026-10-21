/**
 * A tutorial's own texts, by key (its steps', figures', words'), each in its
 * module (i18n/<lang>/tutorials/), the shared phrases staying in
 * <lang>/tutorial.ts, which merges them all.
 */
export interface TutorialTexts {
  /** How to hold the puzzle, its own way (`Tutorial.holding`). */
  readonly holding?: Record<string, (color: string, down: string) => string>
  /** A stage's check, given how far its formula takes it and the pieces it
   *  leaves marked on its side, named. */
  readonly checks?: Record<string, (done: number, pieces?: readonly string[]) => string>
  /** A piece stage's own check once a piece is placed, named (when
   *  « à sa place » would mislead: the Skewb's top corners, placed among
   *  themselves), given how many of its pieces were placed before it and
   *  the color held on top. */
  readonly placed?: Record<string, (piece: string, before: number, up: string) => string>
  readonly figures?: Record<string, string>
  /** The glossary's words (the word defined between `**`, in bold). */
  readonly terms?: Record<string, string>
  /** How far a step has come (its pieces placed, of how many). */
  readonly progress?: Record<string, (done: number, total: number) => string>
  readonly titles?: Record<string, string>
  readonly hints?: Record<string, string>
}

type Merged = { [K in keyof TutorialTexts]-?: NonNullable<TutorialTexts[K]> }

/** Every tutorial's texts in one, by section. */
export function mergeTexts(all: readonly TutorialTexts[]): Merged {
  const merge = <K extends keyof TutorialTexts>(key: K) =>
    Object.assign({}, ...all.map((t) => t[key] ?? {})) as Merged[K]
  return {
    holding: merge('holding'),
    checks: merge('checks'),
    placed: merge('placed'),
    figures: merge('figures'),
    terms: merge('terms'),
    progress: merge('progress'),
    titles: merge('titles'),
    hints: merge('hints'),
  }
}
