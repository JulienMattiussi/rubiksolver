import { describe, expect, it } from 'vitest'
import {
  ALL_MOVES,
  FACES,
  formatMove,
  formatMoves,
  invertMove,
  invertMoves,
  parseMove,
  parseMoves,
  scramble,
  simplifyMoves,
} from '@/lib/moves'
import { seededRng } from '../helpers'

describe('moves notation', () => {
  it('formats each amount', () => {
    expect(formatMove({ face: 'R', amount: 1 })).toBe('R')
    expect(formatMove({ face: 'R', amount: 2 })).toBe('R2')
    expect(formatMove({ face: 'R', amount: 3 })).toBe("R'")
  })

  it('round-trips through parse/format', () => {
    for (const move of ALL_MOVES) {
      expect(parseMove(formatMove(move))).toEqual(move)
    }
  })

  it('parses a whole algorithm and rejects garbage', () => {
    expect(formatMoves(parseMoves("R U R' U'"))).toBe("R U R' U'")
    expect(parseMove('X')).toBeUndefined()
    expect(() => parseMoves('R Q')).toThrow()
  })

  it('inverts moves and sequences', () => {
    expect(invertMove({ face: 'R', amount: 1 })).toEqual({ face: 'R', amount: 3 })
    expect(invertMove({ face: 'R', amount: 2 })).toEqual({ face: 'R', amount: 2 })
    expect(formatMoves(invertMoves(parseMoves("R U F")))).toBe("F' U' R'")
  })

  it('simplifies consecutive same-face turns', () => {
    expect(formatMoves(simplifyMoves(parseMoves('R R')))).toBe('R2')
    expect(simplifyMoves(parseMoves("R R'"))).toEqual([])
    expect(simplifyMoves(parseMoves('R2 R2'))).toEqual([])
    expect(formatMoves(simplifyMoves(parseMoves("R R R")))).toBe("R'")
  })

  it('scrambles deterministically with a seed and never repeats a face', () => {
    const a = scramble(20, seededRng(42))
    const b = scramble(20, seededRng(42))
    expect(a).toEqual(b)
    expect(a).toHaveLength(20)
    for (let i = 1; i < a.length; i++) expect(a[i]!.face).not.toBe(a[i - 1]!.face)
    expect(FACES).toContain(a[0]!.face)
  })
})
