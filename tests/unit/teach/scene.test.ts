import { describe, expect, it } from 'vitest'
import { hasColors } from '@/lib/core/pieces'
import { markerPath, occupantOf, pieceColors, tonesOf } from '@/lib/teach/scene'
import { Y, scrambled, stepOf } from '../tutorials/cube3Fixture'

describe('what a formula does to the pieces', () => {
  const step = stepOf(scrambled)
  const pick = step.suggestion!
  const moves = step.formula(pick)!

  it('tells the piece aimed at, the one in its way, the moved and the still', () => {
    const tones = tonesOf(scrambled, moves, pick, step.placed)
    expect(tones[pick.piece]).toBe('target')
    const occupant = occupantOf(scrambled, pick)
    if (occupant !== null) expect(tones[occupant]).toBe('slot')
    for (const p of step.placed) expect(tones[p]).toBe('placed')
    expect(tones).toContain('moved')
    // The centers never move under outer turns.
    const centers = scrambled.flatMap((c, i) => (c.stickers.length === 1 ? [i] : []))
    for (const c of centers) expect(tones[c]).toBe('still')
  })

  it('follows the marker sticker from its face to the one it lands on', () => {
    const path = markerPath(scrambled, moves, pick.piece, Y)
    expect(path.from).toEqual(scrambled[pick.piece]!.position)
    expect(path.to).toEqual(pick.slot)
    expect(path.toNormal).toEqual([0, -1, 0])
  })

  it('names a piece by its colors, the marker first', () => {
    const colors = pieceColors(scrambled, pick.piece, Y)
    expect(colors[0]).toBe(Y)
    expect(hasColors(scrambled[pick.piece]!, colors)).toBe(true)
  })

  it('finds no one in the way of a piece already at its place', () => {
    expect(
      occupantOf(scrambled, { piece: pick.piece, slot: scrambled[pick.piece]!.position }),
    ).toBeNull()
  })
})
