import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { invertMoves, scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { colorsOf } from '@/lib/core/pieces'
import { applyMoves } from '@/lib/core/turn'
import { isFaceMove, type Cube } from '@/lib/core/types'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { arrowsOf } from '@/lib/teach/scene'
import { seededRng } from '../../helpers'
import { expectSteady, expectTexts, walk } from './walk'

const tutorial = tutorialFor('3', 'crossCorners')!
const stepOf = (cube: Cube) => tutorial.stepOf(cube)!
const SOLVED = solvedCube('3')

/** A state a formula solves, from the solved cube. */
const before = (moves: string) => applyMoves(SOLVED, invertMoves(parseMoves(moves)))

/** What a formula does to the solved cube: each piece it moves or turns,
 *  as `from>to` (its home cell, then where it lands), turned or not. */
function effect(moves: string) {
  const name = ([x, y, z]: readonly number[]) =>
    [
      y! > 0 ? 'U' : y! < 0 ? 'D' : '',
      z! > 0 ? 'F' : z! < 0 ? 'B' : '',
      x! > 0 ? 'R' : x! < 0 ? 'L' : '',
    ].join('')
  const after = applyMoves(SOLVED, parseMoves(moves))
  return SOLVED.flatMap((home) => {
    const c = after.find((a) => colorsOf(a) === colorsOf(home))!
    const same = c.stickers.every(
      (s) => home.stickers.find((h) => h.color === s.color)!.normal.join() === s.normal.join(),
    )
    return same ? [] : [`${name(home.position)}>${name(c.position)}`]
  }).sort()
}

describe('Cross then corners tutorial', () => {
  it('has its steps, the cross first as the beginner’s', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialCross',
      'stepTutorialCrossCornersMiddle',
      'stepTutorialCrossCornersTopEdges',
      'stepTutorialCrossCornersBottom',
      'stepTutorialCrossCornersTop',
      'stepTutorialCrossCornersTwist',
    ])
    expectTexts(tutorial)
  })

  it('plays formulas that do what the method says', () => {
    // The swap: the top's front and left edges swapped, the right one
    // turned over (corners moved too: they come later).
    const swap = "F U R U' R' F' U'"
    expect(effect(swap).filter((p) => p.length === 5)).toEqual(['UF>UL', 'UL>UF', 'UR>UR'])
    // Twice: those two turned over in place, no other edge touched.
    expect(effect(`${swap} ${swap}`).filter((p) => p.length === 5)).toEqual(['UF>UF', 'UL>UL'])
    // Three corners of the front cycled, nothing else.
    expect(effect("L' F R F' L F R' F'")).toEqual(['DFL>UFL', 'UFL>UFR', 'UFR>DFL'])
    // The top's two corners on the right turned in place, nothing else.
    expect(effect("R U2 R' U' R U' R' L' U2 L U L' U L")).toEqual(['UBR>UBR', 'UFR>UFR'])
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(7)
    const figures = new Set<string>()
    let turned = 0
    for (let k = 0; k < 4; k++) {
      const { steps, cube } = walk(tutorial, applyMoves(SOLVED, scramble('3', 20, rng)), 200)
      expect(isSolved(cube)).toBe(true)
      expectSteady(steps)
      // The cube turned whole only to bring a side up, in the same step as
      // the formula it is held for: never a step of its own.
      for (const s of steps) {
        const moves = s.formula(s.suggestion)!
        if (moves.some((m) => isFaceMove(m) && m.whole)) turned++
        expect(moves.some((m) => !(isFaceMove(m) && m.whole))).toBe(true)
      }
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    expect(turned).toBeGreaterThan(0)
    for (const key of figures) {
      expect(TUTORIAL_FR.figures[key], key).toBeDefined()
      expect(TUTORIAL_EN.figures[key], key).toBeDefined()
    }
  })

  it('reads the cube turned in hand as it stands, the steps done still done', () => {
    // Three corners to cycle, the cube on its side: the corners' step,
    // nothing turned back.
    const cube = applyMoves(before("L' F R F' L F R' F'"), parseMoves('z'))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialCrossCornersBottom')
    expect(isSolved(walk(tutorial, cube, 20).cube)).toBe(true)
  })

  it('brings an edge round by a turn of the top, in the step of the formula after it', () => {
    // The front left edge up at the front: the top turned to bring it to
    // the left (not the formula), then the swap held with the left side up,
    // the top in front: one step, which places it.
    const cube = before("U z y F U R U' R' F' U' y' z'")
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialCrossCornersMiddle')
    expect(step.figure).toBe('figureCrossCornersTopSwap')
    expect(isSolved(applyMoves(cube, step.formula(step.suggestion)!))).toBe(true)
  })

  it('turns the corners by the last formula, a corner picked by a click', () => {
    const cube = before("R U2 R' U' R U' R' L' U2 L U L' U L")
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialCrossCornersTwist')
    expect(step.progress).toEqual({ done: 6, total: 8 })
    // Either corner turned wrong may be picked, its place its own: one
    // formula turns both right.
    expect(step.pickable).toHaveLength(2)
    for (const piece of step.pickable) {
      expect(step.slots(piece)).toEqual([cube[piece]!.position])
      const moves = step.formula({ piece, slot: cube[piece]!.position })!
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
    }
  })

  it('turns no corner right for nothing', () => {
    // Three corners turned wrong, two of them side by side: those two
    // first, the third never left alone with a corner right undone.
    const rng = seededRng(5)
    for (let k = 0; k < 3; k++) {
      let cube = applyMoves(SOLVED, scramble('3', 20, rng))
      for (let n = 0; n < 200 && stepOf(cube)?.key !== 'stepTutorialCrossCornersTwist'; n++) {
        const s = stepOf(cube)
        if (!s) break
        cube = applyMoves(cube, s.formula(s.suggestion)!)
      }
      let previous = -1
      for (let n = 0; n < 12 && !isSolved(cube); n++) {
        const s = stepOf(cube)
        expect(s.progress!.done).toBeGreaterThanOrEqual(previous)
        previous = s.progress!.done
        cube = applyMoves(cube, s.formula(s.suggestion)!)
      }
      expect(isSolved(cube)).toBe(true)
    }
  })
})

describe('Cross then corners tutorial, as shown', () => {
  it('turns the cube and plays the formula in one step, its arrows drawn as the cube stands', () => {
    // A middle edge to bring in with another side up.
    const rng = seededRng(3)
    let cube = applyMoves(SOLVED, scramble('3', 20, rng))
    let step = stepOf(cube)
    while (step.key === 'stepTutorialCross' || step.kind !== 'figure') {
      cube = applyMoves(cube, step.formula(step.suggestion)!)
      step = stepOf(cube)
    }
    let seen = 0
    let turnedInPlace = 0
    for (let n = 0; n < 40 && !isSolved(cube); n++) {
      step = stepOf(cube)
      const moves = step.formula(step.suggestion)!
      const arrows = arrowsOf(cube, moves, step, step.kind === 'pieces' ? step.suggestion : null)
      // Each arrow from a piece's sticker as it stands now (the one the
      // formula brings to its side, for a piece not on that side yet).
      for (const a of arrows) {
        const piece = cube[a.piece]!
        expect(piece.position).toEqual(a.from)
        expect(piece.stickers.some((s) => s.normal.join() === a.fromNormal.join())).toBe(true)
      }
      seen += arrows.length
      // Edges turned over, corners turned, in place: an arrow, face to face.
      if (/SwapTwice$/.test(step.figure ?? '') || step.key === 'stepTutorialCrossCornersTwist') {
        expect(arrows.filter((a) => a.from.join() === a.to.join()).length).toBeGreaterThan(0)
        turnedInPlace++
      }
      cube = applyMoves(cube, moves)
    }
    expect(seen).toBeGreaterThan(0)
    expect(turnedInPlace).toBeGreaterThan(0)
  })
})
