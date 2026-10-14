import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { SWAPS } from '@/lib/methods/round/puck'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/core/moves'
import { parsePuckMoves, puckNumber, puckPlace } from '@/lib/puzzles/round/puck'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, PuckMove } from '@/lib/core/types'

const SOLVED = solvedCube('puck')

/** What stands in each slot: a top piece's number, or `.` for a plain one,
 *  top layer then bottom, by sector. */
function layers(cube: Cube): [string[], string[]] {
  const top: string[] = []
  const bottom: string[] = []
  for (const c of cube) {
    const place = puckPlace(c.position)
    if (!place) continue
    const label = String(puckNumber(c) ?? '.')
    if (place.z > 0) top[place.m] = label
    else bottom[place.m] = label
  }
  return [top, bottom]
}

describe('Hockey Puck', () => {
  it('writes its turns as the star prisms do, and reads them back', () => {
    const moves = parsePuckMoves('/ B / 1-B / -1 /', NOTATION_FR)
    expect(formatMoves(moves, NOTATION_FR)).toBe('/ B / 1 -B / -1 /')
    expect(formatMoves(moves, NOTATION_US)).toBe('/ D / 1 -D / -1 /')
  })

  it('turns a layer a twelfth, and slashes its right half over', () => {
    const turned = applyMoves(SOLVED, [{ layer: 'U', steps: 1 }])
    expect(layers(turned)[0].slice(0, 2)).toEqual(['12', '1'])
    const [top, bottom] = layers(applyMoves(SOLVED, [{ flip: true }]))
    // The right half's six top pieces below, back to front; the left kept.
    expect(top.slice(0, 6)).toEqual(['.', '.', '.', '.', '.', '.'])
    expect(top.slice(6)).toEqual(['7', '8', '9', '10', '11', '12'])
    expect(bottom.slice(0, 6)).toEqual(['6', '5', '4', '3', '2', '1'])
  })

  it('swaps two pieces of each layer, d sectors apart, with K and its kin', () => {
    SWAPS.forEach((moves, i) => {
      const d = i + 1
      const after = applyMoves(SOLVED, moves as PuckMove[])
      const [top] = layers(after)
      const moved = top.flatMap((n, m) => (n !== String(m + 1) ? [m] : []))
      expect(moved).toHaveLength(2)
      expect(Math.min(...[moved[1]! - moved[0]!, 12 - moved[1]! + moved[0]!])).toBe(d)
    })
  })

  it('is solved however its whole is turned, not with its top turned alone', () => {
    const whole = applyMoves(SOLVED, [
      { layer: 'U', steps: 2 },
      { layer: 'D', steps: 2 },
    ])
    expect(isSolved(whole)).toBe(true)
    expect(isSolved(applyMoves(SOLVED, [{ layer: 'U', steps: 2 }]))).toBe(false)
  })
})
