import type { CubeShape } from '../core/types'
import type { MethodId } from '../solve/solver'
import type { Tutorial } from '../teach/tutorial'
import { CUBE2_TUTORIAL } from './standard/cube2'
import { CUBE3_TUTORIAL } from './standard/cube3'
import { CUBE4_TUTORIAL } from './standard/cube4'
import { MORPH_TUTORIAL } from './pyramid/morph'
import { PYRAMINX_TUTORIAL } from './pyramid/pyraminx'

/**
 * The tutorials, by puzzle: each teaches one of its solving methods. A
 * puzzle may have several (one per method); the tutorial offered is the
 * one of the method chosen, none if that method has none.
 */

/** A tutorial and the method it teaches. */
interface TutorialEntry {
  readonly method: MethodId
  readonly tutorial: Tutorial
}

const TUTORIALS: Partial<Record<CubeShape, readonly TutorialEntry[]>> = {
  '2': [{ method: 'beginner', tutorial: CUBE2_TUTORIAL }],
  '4': [{ method: 'reduction', tutorial: CUBE4_TUTORIAL }],
  pyra: [{ method: 'centersFirst', tutorial: PYRAMINX_TUTORIAL }],
  morph: [{ method: 'asPocket', tutorial: MORPH_TUTORIAL }],
  '3': [{ method: 'beginner', tutorial: CUBE3_TUTORIAL }],
}

/** The tutorial of a puzzle teaching a method (none if there is none). */
export function tutorialFor(shape: CubeShape, method: MethodId): Tutorial | undefined {
  return TUTORIALS[shape]?.find((e) => e.method === method)?.tutorial
}
