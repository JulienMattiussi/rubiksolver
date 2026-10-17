import type { CubeShape } from '../core/types'
import type { MethodId } from '../solve/solver'
import type { Tutorial } from '../tutorial/tutorial'
import { CUBE3_TUTORIAL } from './standard/cube3'

/**
 * The tutorials, by puzzle: each teaches one of its solving methods. A
 * puzzle may have several (one per method); the tutorial shown follows the
 * method chosen when it has one, else the puzzle's first.
 */

/** A tutorial and the method it teaches. */
interface TutorialEntry {
  readonly method: MethodId
  readonly tutorial: Tutorial
}

const TUTORIALS: Partial<Record<CubeShape, readonly TutorialEntry[]>> = {
  '3': [{ method: 'beginner', tutorial: CUBE3_TUTORIAL }],
}

/** The tutorial of a puzzle for a method (its first if that method has
 *  none; none if the puzzle has no tutorial). */
export function tutorialFor(shape: CubeShape, method?: MethodId): Tutorial | undefined {
  const entries = TUTORIALS[shape] ?? []
  return (entries.find((e) => e.method === method) ?? entries[0])?.tutorial
}
