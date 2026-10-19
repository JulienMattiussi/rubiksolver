import { describe, expect, it } from 'vitest'
import { emptyEdit, progress } from '@/lib/editor/edit'
import { paint } from '@/lib/editor/modes/colors'
import { tablesFor } from '@/lib/editor/editorTables'

describe('star prism editor', () => {
  it('lets any of the 12 points sit in a point slot, the right screw half either way up', () => {
    const tables = tablesFor('star')
    const counts = tables.paintableSlots.map((slot) => tables.placements.get(slot.key)!.length)
    expect(counts).toEqual([...Array(12).fill(12), 2])
  })

  it('keeps the left screw half pre-filled: no turn ever moves it', () => {
    const tables = tablesFor('star')
    const fixed = tables.slots.filter((s) => !s.paintable)
    expect(fixed.map((s) => s.position)).toEqual([[-1, 0, 1]])
    expect(progress(emptyEdit('star'), 'star')).toMatchObject({ filled: 2, total: 40 })
  })

  it("counts only the stickers one sees on the 4-star (its inner points' flat faces are hidden)", () => {
    expect(progress(emptyEdit('star4'), 'star4')).toMatchObject({ filled: 2, total: 64 })
    // Six points on top and the right screw half: the left one is pre-filled.
    expect(progress(emptyEdit('star4'), 'star4').remaining.G).toBe(7)
  })

  it('completes a 4-star inner point from its two sides: their order says which way up', () => {
    const slot = tablesFor('star4').paintableSlots.find((s) => s.position[1] === 1)!
    const sides = slot.stickers.filter((s) => !s.hidden)
    let edit = emptyEdit('star4')
    for (const s of sides) edit = paint(edit, 'star4', slot.key, s.ni, s.solvedColor)
    const hidden = slot.stickers.find((s) => s.hidden)!
    expect(edit[hidden.id]).toBe('G') // an upright top piece
  })
})
