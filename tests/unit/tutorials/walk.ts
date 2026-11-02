import { expect } from 'vitest'
import { isSolved } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Turn } from '@/lib/core/types'
import { formulaSegments, sameTurn } from '@/lib/teach/segments'
import type { Tutorial, TutorialStep } from '@/lib/teach/tutorial'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'

/**
 * What every tutorial's tests do: walk a state to the solve, and check the
 * texts it shows exist in both languages.
 */

/** The steps from a state to the solve, each suggestion's formula played
 *  (each found, each of its formulas played in a row as many times as the
 *  reminder says), `max` steps at most. */
export function walk(tutorial: Tutorial, start: Cube, max: number) {
  let cube = start
  const steps: TutorialStep[] = []
  for (let n = 0; n < max && !isSolved(cube); n++) {
    const step = tutorial.stepOf(cube)!
    const moves = step.formula(step.suggestion)
    expect(moves, step.key).not.toBeNull()
    steps.push(step)
    expectTimes(tutorial, step, moves!)
    cube = applyMoves(cube, moves!)
  }
  return { steps, cube }
}

/** Each formula of a step played in a row a number of times its reminder
 *  declares (`RecapFormula.times`). */
function expectTimes(tutorial: Tutorial, step: TutorialStep, moves: readonly Turn[]) {
  const known = step.algorithms ?? []
  const recap = tutorial.recap.find((s) => s.key === step.key)
  const { frame } = tutorial
  for (const segment of formulaSegments(moves, known, frame)) {
    if (segment.kind !== 'sequence') continue
    const formula = recap?.formulas.find(
      (f) =>
        f.moves.length === segment.moves.length &&
        frame.holds.some((hold) =>
          segment.moves.every((m, j) => sameTurn(frame.inHold(hold, m), f.moves[j]!)),
        ),
    )
    if (formula) expect(formula.times, step.key).toContain(segment.times)
  }
}

/** A walk that never goes back (docs/tutorials.md, rule 2): its stages in
 *  order, and within one, its count never down from a step to the next. */
export function expectSteady(steps: readonly TutorialStep[]) {
  const stages = steps.map((s) => s.stage ?? 0)
  expect(stages.join()).toBe([...stages].sort((a, b) => a - b).join())
  steps.forEach((s, i) => {
    const next = steps[i + 1]
    if (next?.key === s.key && s.progress && next.progress) {
      expect(next.progress.done, s.key).toBeGreaterThanOrEqual(s.progress.done)
    }
  })
}

/** Every stage titled and hinted, and every word of its glossary (those of
 *  any rendering) said, in both languages. */
export function expectTexts(tutorial: Tutorial) {
  for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
    for (const key of tutorial.stageKeys) {
      expect(texts.titles[key], key).toBeTruthy()
      expect(texts.hints[key], key).toBeTruthy()
    }
    for (const term of tutorial.glossary.filter((t) => !t.only)) {
      expect(texts.terms[term.key], term.key).toBeTruthy()
    }
  }
}
