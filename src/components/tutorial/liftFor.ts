import type { TutorialStep } from '@/lib/tutorial/tutorial'

/** How far above the front center the view looks from for a step: high
 *  when the step works on the top (`face`, the last layer: its figure in
 *  sight), else the usual little. */
export const liftFor = (step: TutorialStep | null) => (step?.face === 'U' ? 1.3 : undefined)
