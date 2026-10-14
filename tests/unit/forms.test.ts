import { describe, expect, it } from 'vitest'
import { isBoxed, solvedCube } from '@/lib/cube'
import { buildCube, cubeToEdit, emptyEdit, isComplete, progress } from '@/lib/editor'
import { tablesFor } from '@/lib/editorTables'
import { formsOf, lookOf } from '@/lib/forms'
import { scrambleTurns } from '@/lib/moves'
import { applyMoves } from '@/lib/turn'
import { validateCube } from '@/lib/validate'
import { seededRng } from '../helpers'

describe('forms of a shape-shifting puzzle', () => {
  const forms = formsOf('224')

  it('finds the tower in its box, then its 101 other forms, by pieces sticking out', () => {
    expect(forms).toHaveLength(102)
    expect(lookOf(forms[0]!.cube)).toBe(lookOf(solvedCube('224')))
    const order = forms.map((f) => [f.tips, f.distance] as const)
    const sorted = [...order].sort((a, b) => a[0] - b[0] || a[1] - b[1])
    expect(order).toEqual(sorted)
    expect(forms.map((f) => f.tips).filter((t) => t === 0)).toHaveLength(9)
  })

  it('offers every slot of every form a piece, all 40 stickers to paint', () => {
    for (const { cube } of forms) {
      const tables = tablesFor('224', cube)
      expect(tables.paintableSlots.every((s) => tables.placements.get(s.key)!.length > 0)).toBe(
        true,
      )
      expect(progress(emptyEdit('224', cube), '224', cube)).toMatchObject({ filled: 0, total: 40 })
    }
  })

  it('enters a tower out of its box as it stands, and validates it', () => {
    const rng = seededRng(3)
    let entered = 0
    for (let i = 0; i < 6; i++) {
      const solved = solvedCube('224')
      const cube = applyMoves(solved, scrambleTurns('224', 25, rng, solved))
      if (isBoxed(cube)) continue
      const edit = cubeToEdit(cube)
      expect(isComplete(edit, '224', cube)).toBe(true)
      expect(validateCube(buildCube(edit, '224', cube))).toEqual({ ok: true })
      entered++
    }
    expect(entered).toBeGreaterThan(1)
  }, 15000)

  it('leaves the other puzzles their box only', () => {
    expect(formsOf('3')).toHaveLength(1)
    expect(formsOf('pyra')).toHaveLength(1)
  })
})
