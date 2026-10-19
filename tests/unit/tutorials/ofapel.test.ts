import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { invertMoves, scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { isFaceMove, type Cube, type Cubie, type Move } from '@/lib/core/types'
import { ANTISUNE } from '@/lib/methods/standard/algs'
import { methodsFor } from '@/lib/solve/solver'
import { decodeCube } from '@/lib/app/snapshot'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'

const tutorial = tutorialFor('3', 'ofapel')!
const stepOf = (cube: Cube) => tutorial.stepOf(cube)!

/** The steps from a state to the solve, each suggestion's formula played. */
function walk(cube: Cube) {
  const steps = []
  for (let n = 0; n < 60 && !isSolved(cube); n++) {
    const step = stepOf(cube)
    const moves = step.formula(step.suggestion)
    expect(moves, step.key).not.toBeNull()
    steps.push(step)
    cube = applyMoves(cube, moves!)
  }
  return { steps, cube }
}

/** Every state some formulas reach from a start, told apart by some
 *  pieces only (the others as they come). */
function closure(start: Cube, formulas: readonly string[], which: (c: Cubie) => boolean) {
  const gens: Move[][] = formulas.map((f) => parseMoves(f))
  const key = (c: Cube) => stateKey(c.filter(which))
  const seen = new Map([[key(start), start]])
  let frontier = [start]
  while (frontier.length) {
    frontier = frontier.flatMap((c) =>
      gens.flatMap((g) => {
        const after = applyMoves(c, g)
        if (seen.has(key(after))) return []
        seen.set(key(after), after)
        return [after]
      }),
    )
  }
  return [...seen.values()]
}

/** A state a formula solves, from the solved cube. */
const before = (moves: string) => applyMoves(solvedCube('3'), invertMoves(parseMoves(moves)))

describe('Ofapel tutorial', () => {
  it('has the page’s steps, the cross first as the beginner’s', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialCross',
      'stepTutorialOfapelCorner',
      'stepTutorialOfapelPlace',
      'stepTutorialOfapelTwist',
      'stepTutorialOfapelEdges',
      'stepTutorialOfapelFinish',
    ])
    expect(tutorial.openings).toEqual(['stepHoldCube'])
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(11)
    const figures = new Set<string>()
    for (let k = 0; k < 6; k++) {
      const { steps, cube } = walk(applyMoves(solvedCube('3'), scramble('3', 20, rng)))
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage ?? 0)
      expect(stages).toEqual([...stages].sort())
      // The whole cube turned once only, on its side for the last step.
      const whole = steps.filter((s) =>
        s.formula(s.suggestion)!.some((m) => isFaceMove(m) && m.whole),
      )
      expect(whole.map((s) => s.figure)).toEqual(['figureOfapelOnSide'])
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    for (const key of figures) {
      expect(TUTORIAL_FR.figures[key], key).toBeDefined()
      expect(TUTORIAL_EN.figures[key], key).toBeDefined()
    }
  })

  it('names each stage in both languages', () => {
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) {
        expect(texts.titles[key], key).toBeDefined()
        expect(texts.hints[key], key).toBeDefined()
        expect(texts.progress[key], key).toBeDefined()
      }
      for (const term of tutorial.glossary.filter((t) => !t.only)) {
        expect(texts.terms[term.key], term.key).toBeDefined()
      }
    }
  })

  it('swaps two top corners, or two across by the swap twice', () => {
    const swap = "L' U R U' L U R' U2"
    expect(stepOf(before(swap)).figure).toBe('figureOfapelSwap')
    const across = before("L' U R U' L U R' L' U R U' L U R'")
    expect(stepOf(across).figure).toBe('figureOfapelSwapTwice')
    expect(isSolved(walk(across).cube)).toBe(true)
  })

  it('turns the top corners by the Antisune, then the top back', () => {
    const step = stepOf(before(ANTISUNE))
    expect(step.key).toBe('stepTutorialOfapelTwist')
    expect(step.figure).toBe('figureOfapelTwistLast')
    // Turned right but a quarter off: the top turned back.
    const off = applyMoves(solvedCube('3'), parseMoves('U'))
    expect(stepOf(off).figure).toBe('figureOfapelTwistTurn')
  })

  it('brings a top edge up from the middle layer, the layer turning along', () => {
    const cube = before("R U' R' U Uw' R U R'")
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialOfapelEdges')
    expect(step.progress).toEqual({ done: 3, total: 4 })
    const next = tutorial.stepOf(applyMoves(cube, step.formula(step.suggestion)!))
    expect(next === null || next.key === 'stepTutorialOfapelFinish').toBe(true)
  })

  it('ends on its side, in the M slice, the earlier steps still read done', () => {
    // On its side (z), three edges of the slice to cycle.
    const onSide = applyMoves(solvedCube('3'), parseMoves('z'))
    const cube = applyMoves(onSide, invertMoves(parseMoves("M' U2 M U2")))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialOfapelFinish')
    expect(step.figure).toBe('figureOfapelFinish_swapEdges')
    expect(isSolved(applyMoves(cube, step.formula(null)!))).toBe(true)
  })

  it("is a method too, its slice read from the back allowed (2R' is M)", () => {
    const ofapel = methodsFor('3').find((m) => m.id === 'ofapel')!
    // A state that once failed: M held from the back, written 2R'.
    const reported = decodeCube(
      '1,1,-1:0O2Y5B -1,0,1:1O4Y -1,1,-1:5O1Y2G 0,1,1:2O4B 0,1,0:2O 1,-1,0:0O3G -1,1,1:4O2W1B 1,1,0:0O2W 1,1,1:0O4W2G -1,-1,0:3Y1B -1,0,0:1Y -1,1,0:1Y2G 0,0,-1:5B 0,0,0: 0,0,1:4G 0,1,-1:5W2B 1,0,0:0W -1,0,-1:1W5G 1,-1,-1:5R0Y3B 1,0,-1:0R5Y -1,-1,1:1R4Y3G 1,0,1:4R0B 0,-1,0:3R 0,-1,1:4R3G 1,-1,1:0R3W4B 0,-1,-1:3R5W -1,-1,-1:5R3W1G',
    )!
    const rng = seededRng(5)
    for (const cube of [
      reported,
      ...Array.from({ length: 20 }, () => applyMoves(solvedCube('3'), scramble('3', 20, rng))),
    ]) {
      const moves = ofapel.solve(cube).flatMap((s) => s.moves)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
    }
  })

  it('places and turns the top corners from each of their 648 cases', () => {
    const topCorner = (c: Cubie) =>
      c.stickers.length === 3 && c.stickers.some((s) => s.color === 'W')
    const cases = closure(solvedCube('3'), ['U', "L' U R U' L U R' U2", ANTISUNE], topCorner)
    // Every case a 3x3 allows: 4! places, 3^3 ways to turn them.
    expect(cases).toHaveLength(648)
    for (let cube of cases) {
      for (let n = 0; n < 12; n++) {
        const step = tutorial.stepOf(cube)
        if (!step || step.stage! >= 5) break
        cube = applyMoves(cube, step.formula(step.suggestion)!)
      }
      const step = tutorial.stepOf(cube)
      expect(step === null || step.stage! >= 5).toBe(true)
    }
  })

  it('solves the M slice, by the method, from each of its 384 cases', () => {
    const ofapel = methodsFor('3').find((m) => m.id === 'ofapel')!
    const inSlice = (c: Cubie) => c.position[0] === 0 && c.stickers.length > 0
    const cases = closure(
      applyMoves(solvedCube('3'), parseMoves('z')),
      ['M', "M' U2 M U2", "B' U' R' U M' U' R U M B", "M U M U M U2 M' U M' U M' U2"],
      inSlice,
    )
    // Every case a 3x3 allows: 4! edges and 4 turns of the centers (of a
    // parity), 2^3 ways to flip the edges.
    expect(cases).toHaveLength(384)
    for (const cube of cases) {
      const moves = ofapel.solve(cube).flatMap((s) => s.moves)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
    }
  }, 30_000)
})
