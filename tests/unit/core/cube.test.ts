import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { faceLayers, layerCoords } from '@/lib/core/geometry'
import { applyMove, applyMoves, inSlab, moveSlab, turnAllowed, turnedBy } from '@/lib/core/turn'
import { invertMoves, movesFor, scramble } from '@/lib/core/moves'
import { formatMove, parseMoves } from '@/lib/core/notation'
import { SHAPE_DIMS } from '@/lib/core/shapes'
import type { Move } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { seededRng } from '../../helpers'

describe('cube engine', () => {
  it('has 27 cubies with the right sticker counts', () => {
    const cube = solvedCube()
    expect(cube).toHaveLength(27)
    const counts = cube.map((c) => c.stickers.length).sort()
    // 8 corners (3 stickers), 12 edges (2), 6 centers (1), 1 core (0).
    expect(counts.filter((n) => n === 3)).toHaveLength(8)
    expect(counts.filter((n) => n === 2)).toHaveLength(12)
    expect(counts.filter((n) => n === 1)).toHaveLength(6)
    expect(counts.filter((n) => n === 0)).toHaveLength(1)
  })

  it('four quarter turns of any face return to solved', () => {
    for (const face of ['U', 'D', 'L', 'R', 'F', 'B'] as const) {
      const move = { face, amount: 1 } as const
      const cube = applyMoves(solvedCube(), [move, move, move, move])
      expect(isSolved(cube)).toBe(true)
    }
  })

  it("the sexy move (R U R' U') repeated 6 times is identity", () => {
    const sexy = parseMoves("R U R' U'")
    let cube = solvedCube()
    for (let i = 0; i < 6; i++) cube = applyMoves(cube, sexy)
    expect(isSolved(cube)).toBe(true)
  })
})

describe('2x2 cube engine', () => {
  it('has 8 corner cubies in {-1,1}^3', () => {
    const cube = solvedCube('2')
    expect(cube).toHaveLength(8)
    expect(cubeShape(cube)).toBe('2')
    expect(cubeShape(solvedCube())).toBe('3')
    expect(cube.every((c) => c.stickers.length === 3)).toBe(true)
    expect(cube.every((c) => c.position.every((v) => v === 1 || v === -1))).toBe(true)
  })

  it("treats a reoriented solved cube as solved (R L' spins the whole 2x2)", () => {
    // On a 2x2, R and L' rotate the two layers the same way: the cube ends
    // solved but reoriented, which the uniform-faces rule must accept.
    expect(isSolved(applyMoves(solvedCube('2'), parseMoves("R L'")))).toBe(true)
  })
})

describe('4x4 cube engine', () => {
  it('has 64 cubies in {-3,-1,1,3}^3 with the right sticker counts', () => {
    const cube = solvedCube('4')
    expect(cube).toHaveLength(64)
    expect(cubeShape(cube)).toBe('4')
    const counts = cube.map((c) => c.stickers.length)
    // 8 corners (3 stickers), 24 wing edges (2), 24 movable centers (1), 8 hidden inner (0).
    expect(counts.filter((n) => n === 3)).toHaveLength(8)
    expect(counts.filter((n) => n === 2)).toHaveLength(24)
    expect(counts.filter((n) => n === 1)).toHaveLength(24)
    expect(counts.filter((n) => n === 0)).toHaveLength(8)
    expect(cube.every((c) => c.position.every((v) => [-3, -1, 1, 3].includes(v)))).toBe(true)
    expect(isSolved(cube)).toBe(true)
  })

  it('selects the right layers for outer, slice and wide moves', () => {
    // A slab is named by its cut planes; which layers it holds is what the
    // engine reads back through `inSlab`.
    const holds = (move: Move, shape: CubeShape) => {
      const dims = SHAPE_DIMS[shape]
      const range = moveSlab(move, dims)
      return layerCoords(faceLayers(dims, move.face)).filter((c) => inSlab(c, range))
    }
    expect(holds({ face: 'R', amount: 1 }, '4')).toEqual([3])
    expect(holds({ face: 'R', amount: 1, depth: 2 }, '4')).toEqual([1])
    expect(holds({ face: 'R', amount: 1, depth: 2, wide: true }, '4')).toEqual([1, 3])
    expect(holds({ face: 'L', amount: 1, depth: 2 }, '4')).toEqual([-1])
    expect(holds({ face: 'L', amount: 1 }, '3')).toEqual([-1])
    expect(holds({ face: 'U', amount: 1 }, '2')).toEqual([1])
    // Three layers do have an inner one (the M slice); two do not.
    expect(holds({ face: 'R', amount: 1, depth: 2 }, '3')).toEqual([0])
    expect(() => moveSlab({ face: 'R', amount: 1, depth: 2 }, SHAPE_DIMS['2'])).toThrow()
  })

  it('any single turn unsolves, four quarter turns and move+inverse are no-ops', () => {
    for (const move of movesFor('4')) {
      expect(isSolved(applyMove(solvedCube('4'), move))).toBe(false)
      expect(isSolved(applyMoves(solvedCube('4'), [move, ...invertMoves([move])]))).toBe(true)
      if (move.amount === 1) {
        expect(isSolved(applyMoves(solvedCube('4'), [move, move, move, move]))).toBe(true)
      }
    }
  })

  it('a wide turn equals the outer turn plus the inner slice', () => {
    for (const move of movesFor('4').filter((m) => m.wide)) {
      const viaWide = applyMove(solvedCube('4'), move)
      const viaTwo = applyMoves(solvedCube('4'), [
        { face: move.face, amount: move.amount },
        { face: move.face, amount: move.amount, depth: 2 },
      ])
      expect(stateKey(viaWide)).toBe(stateKey(viaTwo))
    }
  })
})

describe('tower turns (a 4x4x4 mechanism with pieces missing)', () => {
  /** Quarter turns the tower can make after `moves`, as notation. */
  const allowed = (moves: string) => {
    const cube = applyMoves(solvedCube('224'), parseMoves(moves))
    return movesFor('224')
      .filter((m) => m.amount === 1 && turnAllowed(cube, m))
      .map((m) => formatMove(m))
  }
  const WIDE = ['Uw', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw']

  it('has outer and wide turns on every face, no inner slice', () => {
    const moves = movesFor('224')
    expect(moves.some((m) => m.depth && !m.wide)).toBe(false)
    expect(moves).toHaveLength(6 * 3 * 2)
  })

  it('in its box, turns its ends (U, D) and every wide turn', () => {
    expect(allowed('')).toEqual(['U', 'Uw', 'D', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw'])
  })

  it('turns an end that is a complete 2x2, however short the axis', () => {
    // A 2x2x2 block standing on a laid-down plank: three cubes tall, yet its
    // top is a full 2x2, so U turns; the bottom (the plank) has no 2x2 end.
    const state = 'Rw Dw2 Rw2'
    expect(allowed(state)).toContain('U')
    expect(allowed(state)).not.toContain('D')
  })

  it('jams an end that is not a complete 2x2', () => {
    // Rw lays the right half down: the top keeps two cubes, the front too.
    expect(allowed('Rw')).toEqual(WIDE)
    // Both halves laid down: front and back ends are full 2x2 again.
    expect(allowed("Rw Lw'")).toEqual([...WIDE.slice(0, 4), 'F', 'Fw', 'B', 'Bw'].sort(byFace))
  })

  it('every other puzzle allows every one of its turns', () => {
    for (const shape of ['2', '3', '4', '123', '332'] as CubeShape[]) {
      const cube = applyMoves(solvedCube(shape), scramble(shape, 20, seededRng(4)))
      expect(movesFor(shape).every((m) => turnAllowed(cube, m))).toBe(true)
    }
  })

  it('scrambles a tower with turns it can actually make', () => {
    const rng = seededRng(21)
    let cube = solvedCube('224')
    for (const move of scramble('224', 60, rng, cube)) {
      expect(turnAllowed(cube, move)).toBe(true)
      cube = applyMove(cube, move)
    }
  })
})

/** Notation order of movesFor: U D L R F B, outer before wide. */
function byFace(a: string, b: string): number {
  const rank = (m: string) => 'UDLRFB'.indexOf(m[0]!) * 2 + (m.endsWith('w') ? 1 : 0)
  return rank(a) - rank(b)
}

describe('turnedBy', () => {
  const count = (shape: CubeShape, move: string) => {
    const cube = solvedCube(shape)
    const turned = turnedBy(cube, parseMoves(move)[0]!)
    return cube.filter((_, i) => turned(i)).length
  }

  it('names the cubies a turn moves, on every shape', () => {
    expect(count('3', 'R')).toBe(9)
    expect(count('3', 'M')).toBe(9)
    expect(count('4', 'Rw')).toBe(32)
    expect(count('332', 'U')).toBe(9)
    // The tower turns like a 4x4x4: Rw is its whole right half, U its top end.
    expect(count('224', 'Rw')).toBe(8)
    expect(count('224', 'U')).toBe(4)
  })
})
