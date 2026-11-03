import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { colorsOf, layoutKey, recolored } from '@/lib/core/pieces'
import { thicknessOf } from '@/lib/core/shape'
import { CUBE_KINDS, mirrorOnly } from '@/lib/core/shapes'
import { scrambleTurns } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import type { Color, Cube } from '@/lib/core/types'
import { cubeToEdit, emptyEdit, slotsFor } from '@/lib/editor/edit'
import { paint } from '@/lib/editor/modes/colors'
import { validateCube } from '@/lib/editor/validate'
import { solveOptimal2 } from '@/lib/methods/standard/cube2'
import { asPocket } from '@/lib/methods/standard/qiyi2'
import { methodsFor } from '@/lib/solve/solver'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('qiyi2')

/** A 2x2's six colors as the Qiyi 2x2 shows them, by size. */
const BY_SIZE = new Map<Color, Color>([
  ['W', 'W'],
  ['R', 'W'],
  ['B', 'W'],
  ['Y', 'Y'],
  ['O', 'Y'],
  ['G', 'Y'],
])

const scrambled = (seed: number) =>
  applyMoves(SOLVED, scrambleTurns('qiyi2', 11, seededRng(seed), SOLVED))

describe('the Qiyi 2x2', () => {
  it('is sold only as a mirror, silver, its layers 3 and 2 cm', () => {
    expect(CUBE_KINDS.filter((k) => k.shape === 'qiyi2').map((k) => k.variant)).toEqual(['mirror'])
    expect(mirrorOnly('qiyi2')?.finish).toBe('silver')
    const { W, Y } = thicknessOf('qiyi2', 'mirror')
    expect(W / Y).toBeCloseTo(3 / 2)
    expect(W + Y).toBeCloseTo(2)
  })

  it('wears two colors, its corners going by threes of twins', () => {
    const kinds = SOLVED.map(colorsOf)
    const count = (k: string) => kinds.filter((x) => x === k).length
    expect(new Set(kinds).size).toBe(4)
    expect([...new Set(kinds)].map(count).sort()).toEqual([1, 1, 3, 3])
  })

  it('is told apart from the 2x2, though as many pieces and stickers', () => {
    expect(cubeShape(SOLVED)).toBe('qiyi2')
    expect(cubeShape(solvedCube('2'))).toBe('2')
  })

  it('is solved held any way, its turned faces a whole-cube turn', () => {
    expect(isSolved(applyMoves(SOLVED, parseMoves("R L'")))).toBe(true)
    expect(solveOptimal2(applyMoves(SOLVED, parseMoves("R L' U D'")))).toEqual([])
  })

  it('is read as a real 2x2 that its turns solve as they solve it', () => {
    for (const seed of [1, 2, 3]) {
      const cube = scrambled(seed)
      const pocket = asPocket(cube)
      expect(cubeShape(pocket)).toBe('2')
      expect(layoutKey(recolored(pocket, BY_SIZE))).toBe(layoutKey(cube))
      const moves = solveOptimal2(pocket)
      expect(isSolved(applyMoves(pocket, moves))).toBe(true)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
      // Its own optimal solution, no longer: the 2x2 read is the nearest.
      expect(moves.length).toBe(solveOptimal2(cube).length)
    }
  })

  it('solves in as many turns as a scramble at most, with every method', () => {
    const cube = applyMoves(SOLVED, parseMoves("R U2 F' R'"))
    expect(solveOptimal2(cube).length).toBeLessThanOrEqual(4)
    for (const method of methodsFor('qiyi2')) {
      const moves = method.solve(cube).flatMap((s) => s.moves)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
    }
  })

  it('is entered click by click, no piece already in place taken back', () => {
    for (const seed of [1, 2, 3]) {
      const target = cubeToEdit(scrambled(seed))
      let edit = emptyEdit('qiyi2')
      for (const slot of slotsFor('qiyi2')) {
        for (const s of slot.stickers) edit = paint(edit, 'qiyi2', slot.key, s.ni, target[s.id]!)
        // Each piece kept as painted, those before it too.
        for (const done of slotsFor('qiyi2').slice(0, slotsFor('qiyi2').indexOf(slot) + 1))
          for (const s of done.stickers) expect(edit[s.id]).toBe(target[s.id])
      }
      expect(edit).toEqual(target)
    }
  })

  it('takes a corner twisted on its own: the all-thick one turns unseen', () => {
    // A corner of two thick sides and a thin one: its twist shows.
    const i = SOLVED.findIndex((c) => new Set(c.stickers.map((s) => s.color)).size === 2)
    const twisted: Cube = SOLVED.map((c, j) =>
      j === i
        ? {
            ...c,
            stickers: c.stickers.map((s, k) => ({ ...s, color: c.stickers[(k + 1) % 3]!.color })),
          }
        : c,
    )
    expect(isSolved(twisted)).toBe(false)
    expect(validateCube(twisted)).toEqual({ ok: true })
    expect(isSolved(applyMoves(twisted, solveOptimal2(twisted)))).toBe(true)
  })
})
