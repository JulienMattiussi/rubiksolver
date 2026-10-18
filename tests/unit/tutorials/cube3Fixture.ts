import { FACE_COLOR, solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import type { TutorialStep } from '@/lib/teach/tutorial'
import { tutorialFor } from '@/lib/tutorials/registry'

/** The 3x3 tutorial's tests' shared ground: yellow, a fixed scramble, and
 *  the step a state stands at (where the step began, if not there). */
export const Y = FACE_COLOR.D
export const scrambled = applyMoves(solvedCube('3'), parseMoves("R U F' L2 D B' R2 U' F L D2 B"))
export const stepOf = (cube: Cube, begun?: Cube): TutorialStep =>
  tutorialFor('3', 'beginner')!.stepOf(cube, begun)!
