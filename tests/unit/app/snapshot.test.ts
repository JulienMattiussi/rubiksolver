import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { DODECA_NORMALS, HEX_NORMALS, normalIndex, normalOfIndex } from '@/lib/core/geometry'
import { parseMoves } from '@/lib/core/moves'
import { decodeCube, encodeCube } from '@/lib/app/snapshot'

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

describe('normal indices', () => {
  it("keep the star's when the dodecahedron shares its normals", () => {
    HEX_NORMALS.forEach((n, i) => expect(normalIndex(n)).toBe(6 + i))
    for (const n of DODECA_NORMALS) expect(normalOfIndex(normalIndex(n))).toEqual(n)
  })
})
