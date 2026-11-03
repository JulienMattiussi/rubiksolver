import { cubeKindId, SHAPE_LABEL, type CubeKind } from '@/lib/core/shapes'
import { methodsFor } from '@/lib/solve/solver'
import { tutorialFor } from '@/lib/tutorials/registry'
import type { Translations } from '@/i18n/translations'

/**
 * What a puzzle's page says of it, in one language: the same on the page
 * the app shows (beside the puzzle, or in a dialog) and on the one written
 * for the search engines (seo/pages.tsx). A hook rather than a datasheet:
 * its own words (`puzzles.ts`), or, where it has none yet, its methods
 * named from the solver's registry, those with a tutorial put forward.
 */

/** A puzzle's own words (`puzzles.ts`). */
interface PuzzleText {
  readonly summary: string
  readonly about: string
  readonly methodsTitle: string
  readonly methods: string
}

export interface About {
  /** The puzzle's name. */
  readonly name: string
  /** Its hook in a search engine's result. */
  readonly summary: string
  /** What it is like, none until it has its own words; words between `**`
   *  in bold, as in all but `summary`. */
  readonly about?: string
  /** The hook above its methods, none until it has its own words. */
  readonly methodsTitle?: string
  /** Its methods, from a step back. */
  readonly methods: string
}

/** A puzzle's page, in the language of `t`. */
export function aboutOf(t: Translations, kind: CubeKind): About {
  const name = t.cubeKind(SHAPE_LABEL[kind.shape], kind.variant)
  const own = (t.puzzles as Partial<Record<string, PuzzleText>>)[cubeKindId(kind)]
  if (own) return { name, ...own }
  const methods = methodsFor(kind.shape)
  const names = methods.map((m) => t.methods[m.id].name)
  const taught = methods
    .filter((m) => tutorialFor(kind.shape, m.id))
    .map((m) => t.methods[m.id].name)
  return {
    name,
    summary: t.puzzleDescription(name, names),
    methods: t.puzzleMethods(names, taught),
  }
}
