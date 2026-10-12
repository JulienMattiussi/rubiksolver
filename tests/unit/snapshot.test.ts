import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/cube'
import { applyMoves } from '@/lib/turn'
import { parseMoves } from '@/lib/moves'
import { decodeCube, encodeCube } from '@/lib/snapshot'

describe('cube snapshots', () => {
  it('reject malformed text and foreign pieces', () => {
    const text = encodeCube(solvedCube('3'))
    expect(decodeCube('')).toBeNull()
    expect(decodeCube('garbage')).toBeNull()
    expect(decodeCube(text.replace('W', 'X'))).toBeNull()
    // A white sticker turned yellow: two yellow-white... no such piece.
    expect(decodeCube(text.replace('W', 'Y'))).toBeNull()
    // Dropping a cubie leaves a count no puzzle has.
    expect(decodeCube(text.split(' ').slice(1).join(' '))).toBeNull()
  })
})

describe('cube snapshots of a shifted tower', () => {
  it('round-trip pieces standing out of the box', () => {
    const cube = applyMoves(solvedCube('224'), parseMoves('Rw Dw2 Rw2'))
    expect(stateKey(decodeCube(encodeCube(cube))!)).toBe(stateKey(cube))
  })
})
