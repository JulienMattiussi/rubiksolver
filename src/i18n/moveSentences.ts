import type { MoveDescription } from '@/lib/core/guide'

/** A description of this kind (lib/core/guide.ts). */
export type Described<K extends MoveDescription['kind']> = MoveDescription & { readonly kind: K }

/** A language's sentence for each kind of turn, the guide's (long) or the
 *  tutorial's (short): its type makes every kind say its own. */
export type MoveSentences = {
  readonly [K in MoveDescription['kind']]: (d: Described<K>) => string
}

/** A turn's sentence, its kind's. */
export const sentenceOf = (sentences: MoveSentences, d: MoveDescription): string =>
  (sentences[d.kind] as (d: MoveDescription) => string)(d)
