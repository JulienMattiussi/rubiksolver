import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { formsOf, lookOf } from '@/lib/forms'
import { parseMoves } from '@/lib/moves'
import { applyMoves } from '@/lib/turn'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('morph')

describe('Pyramorphinx model', () => {
  it('is a 2x2 cut to a tetrahedron: 4 corners, 4 face middles, told from the 2x2', () => {
    expect(SOLVED.map((c) => c.stickers.length).sort()).toEqual([1, 1, 1, 1, 3, 3, 3, 3])
    expect(cubeShape(SOLVED)).toBe('morph')
    expect(cubeShape(solvedCube('2'))).toBe('2')
  })

  it('turns like a 2x2: a big piece lands where a small one was, changing its form', () => {
    const turned = applyMoves(SOLVED, parseMoves('R'))
    expect(isSolved(turned)).toBe(false)
    expect(lookOf(turned)).not.toBe(lookOf(SOLVED))
    // Turned twice more, the form is back (pieces of each kind in place).
    expect(lookOf(applyMoves(turned, parseMoves('R')))).toBe(lookOf(SOLVED))
  })

  it('takes 7 forms, the tetrahedron first', () => {
    const forms = formsOf('morph')
    expect(forms).toHaveLength(7)
    expect(lookOf(forms[0]!.cube)).toBe(lookOf(SOLVED))
  })
})

/** The cube with one piece's stickers moved one along (a corner twisted). */
const twisted = (index: number) =>
  SOLVED.map((c, i) =>
    i === index
      ? {
          position: c.position,
          stickers: c.stickers.map((s, k) => ({
            normal: s.normal,
            color: c.stickers[(k + 1) % 3]!.color,
          })),
        }
      : c,
  )

describe('Pyramorphinx solving and validation', () => {
  it('counts a lone corner twisted as solvable: its twist hides in the middles', () => {
    // fan2cube's twist "singularity": a 2x2's twist law, balanced by the
    // face middles, whose own twist does not show.
    const corner = SOLVED.findIndex((c) => c.stickers.length === 3)
    expect(validateCube(twisted(corner))).toEqual({ ok: true })
  })

  it('rejects a corner in mirror image (two of its colors swapped)', () => {
    const corner = SOLVED.findIndex((c) => c.stickers.length === 3)
    const mirrored = SOLVED.map((c, i) =>
      i === corner
        ? {
            position: c.position,
            stickers: c.stickers.map((s, k) => ({
              normal: s.normal,
              color: c.stickers[k === 0 ? 1 : k === 1 ? 0 : 2]!.color,
            })),
          }
        : c,
    )
    expect(validateCube(mirrored)).toMatchObject({ ok: false, error: 'impossible' })
  })
})
