import { describe, expect, it } from 'vitest'
import {
  ALL_MOVES,
  FACES,
  formatMove,
  formatMoves,
  invertMove,
  invertMoves,
  movesFor,
  NOTATION_FR,
  NOTATION_US,
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

  it('reads M, E and S as the middle slices of a 3x3, in every notation', () => {
    expect(parseMove("M'")).toEqual({ face: 'L', amount: 3, depth: 2 })
    expect(parseMove('E2', NOTATION_FR)).toEqual({ face: 'D', amount: 2, depth: 2 })
    expect(parseMove('S')).toEqual({ face: 'F', amount: 1, depth: 2 })
    expect(parseMove('2M')).toBeUndefined()
    const dims = [3, 3, 3] as const
    expect(formatMoves(parseMoves("M' E2 S"), NOTATION_FR, dims)).toBe("M' E2 S")
    // The slice is named after the face it follows: 2R turns it the M' way.
    expect(formatMove({ face: 'R', amount: 1, depth: 2 }, NOTATION_US, dims)).toBe("M'")
    // Without the dims (or on a 4x4) it stays an inner slice.
    expect(formatMove({ face: 'L', amount: 1, depth: 2 })).toBe('2L')
    expect(formatMove({ face: 'L', amount: 1, depth: 2 }, NOTATION_US, [4, 4, 4])).toBe('2L')
  })

  it('inverts moves and sequences', () => {
    expect(invertMove({ face: 'R', amount: 1 })).toEqual({ face: 'R', amount: 3 })
    expect(invertMove({ face: 'R', amount: 2 })).toEqual({ face: 'R', amount: 2 })
    expect(formatMoves(invertMoves(parseMoves('R U F')))).toBe("F' U' R'")
  })

  it('simplifies consecutive same-face turns', () => {
    expect(formatMoves(simplifyMoves(parseMoves('R R')))).toBe('R2')
    expect(simplifyMoves(parseMoves("R R'"))).toEqual([])
    expect(simplifyMoves(parseMoves('R2 R2'))).toEqual([])
    expect(formatMoves(simplifyMoves(parseMoves('R R R')))).toBe("R'")
  })

  it('scrambles deterministically with a seed and never repeats a face', () => {
    const a = scramble('3', 20, seededRng(42))
    const b = scramble('3', 20, seededRng(42))
    expect(a).toEqual(b)
    expect(a).toHaveLength(20)
    for (let i = 1; i < a.length; i++) expect(a[i]!.face).not.toBe(a[i - 1]!.face)
    expect(FACES).toContain(a[0]!.face)
  })
})

describe('layered moves notation (4x4)', () => {
  it('formats slices and wide turns in both notations', () => {
    expect(formatMove({ face: 'R', amount: 1, depth: 2 })).toBe('2R')
    expect(formatMove({ face: 'R', amount: 3, depth: 2 })).toBe("2R'")
    expect(formatMove({ face: 'R', amount: 2, depth: 2, wide: true })).toBe('Rw2')
    expect(formatMove({ face: 'R', amount: 1, depth: 2 }, NOTATION_FR)).toBe('2D')
    expect(formatMove({ face: 'B', amount: 1, depth: 2 }, NOTATION_FR)).toBe('2Ar')
    expect(formatMove({ face: 'B', amount: 1, depth: 2, wide: true }, NOTATION_FR)).toBe('Arw')
  })

  it('round-trips all 54 moves through parse/format in both notations', () => {
    for (const labels of [NOTATION_US, NOTATION_FR]) {
      for (const move of movesFor('4')) {
        expect(parseMove(formatMove(move, labels), labels)).toEqual(move)
      }
    }
  })

  it('rejects non-canonical or unknown tokens', () => {
    expect(parseMove('2Rw')).toBeUndefined()
    expect(parseMove('w')).toBeUndefined()
    expect(parseMove('2X')).toBeUndefined()
    expect(parseMove('2')).toBeUndefined()
    expect(parseMove('2H')).toBeUndefined() // FR label in US notation
  })

  it('keeps layers through inversion and simplification', () => {
    expect(invertMove({ face: 'R', amount: 1, depth: 2 })).toEqual({
      face: 'R',
      amount: 3,
      depth: 2,
    })
    expect(invertMove({ face: 'R', amount: 1, depth: 2, wide: true })).toEqual({
      face: 'R',
      amount: 3,
      depth: 2,
      wide: true,
    })
    expect(formatMoves(simplifyMoves(parseMoves('2R 2R')))).toBe('2R2')
    expect(simplifyMoves(parseMoves("Rw Rw'"))).toEqual([])
    // Same face but different layers must never merge.
    expect(formatMoves(simplifyMoves(parseMoves('R 2R')))).toBe('R 2R')
    expect(formatMoves(simplifyMoves(parseMoves('R Rw')))).toBe('R Rw')
  })

  it('lists 18 moves up to the 3x3 and 54 on the 4x4', () => {
    expect(movesFor('2')).toHaveLength(18)
    expect(movesFor('3')).toHaveLength(18)
    expect(movesFor('4')).toHaveLength(54)
  })

  it('4x4 scrambles mix outer, slice and wide moves; smaller sizes stay outer', () => {
    const moves = scramble('4', 40, seededRng(7))
    expect(moves).toHaveLength(40)
    expect(moves.some((m) => m.depth && !m.wide)).toBe(true)
    expect(moves.some((m) => m.wide)).toBe(true)
    expect(moves.some((m) => !m.depth)).toBe(true)
    for (let i = 1; i < moves.length; i++) expect(moves[i]!.face).not.toBe(moves[i - 1]!.face)
    expect(scramble('3', 30, seededRng(7)).every((m) => !m.depth && !m.wide)).toBe(true)
  })
})
