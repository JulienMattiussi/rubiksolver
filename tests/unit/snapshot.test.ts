import { describe, expect, it } from 'vitest'
import { applyMoves, solvedCube, stateKey } from '@/lib/cube'
import { scramble } from '@/lib/moves'
import { decodeCube, encodeCube } from '@/lib/snapshot'
import type { CubeShape } from '@/lib/types'
import { seededRng } from '../helpers'

describe('cube snapshots', () => {
  it('round-trip a scrambled state of every shape', () => {
    const rng = seededRng(11)
    for (const shape of ['2', '3', '4', '123'] as CubeShape[]) {
      const cube = applyMoves(solvedCube(shape), scramble(shape, 20, rng))
      expect(stateKey(decodeCube(encodeCube(cube))!)).toBe(stateKey(cube))
    }
  })

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
