import type { CubeShape } from '../core/shapes'
import type { MethodId } from '../solve/solver'
import type { Tutorial } from '../teach/tutorial'
import { CUBE2_TUTORIAL } from './standard/cube2'
import { OFAPEL_TUTORIAL } from './standard/ofapel'
import { CUBE3_TUTORIAL } from './standard/cube3'
import { CUBE4_TUTORIAL } from './standard/cube4'
import { CUBE5_TUTORIAL } from './standard/cube5'
import { SUPER4_TUTORIAL, SUPER5_TUTORIAL } from './standard/superCubes'
import { MORPH_TUTORIAL } from './pyramid/morph'
import { CUBE123_TUTORIAL } from './flat/cube123'
import { FLOPPY_TUTORIAL } from './flat/floppy'
import { GHOST_TUTORIAL } from './flat/ghost'
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
  '5': [{ method: 'reduction', tutorial: CUBE5_TUTORIAL }],
  super4: [{ method: 'reduction', tutorial: SUPER4_TUTORIAL }],
  super5: [{ method: 'reduction', tutorial: SUPER5_TUTORIAL }],
  pyra: [{ method: 'centersFirst', tutorial: PYRAMINX_TUTORIAL }],
  '123': [{ method: 'cornersFirst', tutorial: CUBE123_TUTORIAL }],
  '331': [{ method: 'cornersFirst', tutorial: FLOPPY_TUTORIAL }],
  ghost: [{ method: 'cornersFirst', tutorial: GHOST_TUTORIAL }],
  morph: [{ method: 'asPocket', tutorial: MORPH_TUTORIAL }],
  '3': [
    { method: 'beginner', tutorial: CUBE3_TUTORIAL },
    { method: 'ofapel', tutorial: OFAPEL_TUTORIAL },
  ],
}

/** Whether a puzzle has a tutorial, for one method or another. */
export const hasTutorial = (shape: CubeShape): boolean => (TUTORIALS[shape]?.length ?? 0) > 0

/** The tutorial of a puzzle teaching a method (none if there is none). */
export function tutorialFor(shape: CubeShape, method: string): Tutorial | undefined {
  return TUTORIALS[shape]?.find((e) => e.method === method)?.tutorial
}
