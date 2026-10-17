import type { TutorialStep } from '@/lib/tutorial/tutorial'

/** How the view looks at a step's front: raised toward the side the step
 *  works on (`side`: the last layer's top, its figure in sight), else the
 *  usual little above. */
export const liftFor = (step: TutorialStep | null) =>
  step?.side ? { amount: 1.3, toward: step.side } : undefined
