import { describe, expect, it } from 'vitest'
import {
  applyMove,
  applyMoves,
  cubeOrientations,
  cubeShape,
  isSolved,
  faceLayers,
  inLayer,
  layerCoords,
  moveLayerRange,
  solvedCube,
  stateKey,
} from '@/lib/cube'
import { ALL_MOVES, invertMoves, movesFor, parseMoves, scramble } from '@/lib/moves'
import { SHAPE_DIMS } from '@/lib/types'
import type { CubeShape, Move } from '@/lib/types'
import { seededRng } from '../helpers'

describe('cube engine', () => {
  it('starts solved', () => {
    expect(isSolved(solvedCube())).toBe(true)
  })

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

  it('a single face turn leaves the cube unsolved', () => {
    for (const move of ALL_MOVES) {
      expect(isSolved(applyMove(solvedCube(), move))).toBe(false)
    }
  })

  it('four quarter turns of any face return to solved', () => {
    for (const face of ['U', 'D', 'L', 'R', 'F', 'B'] as const) {
      const move = { face, amount: 1 } as const
      const cube = applyMoves(solvedCube(), [move, move, move, move])
      expect(isSolved(cube)).toBe(true)
    }
  })

  it('a move followed by its inverse is a no-op', () => {
    for (const move of ALL_MOVES) {
      const cube = applyMoves(solvedCube(), [move, ...invertMoves([move])])
      expect(isSolved(cube)).toBe(true)
    }
  })

  it("the sexy move (R U R' U') repeated 6 times is identity", () => {
    const sexy = parseMoves("R U R' U'")
    let cube = solvedCube()
    for (let i = 0; i < 6; i++) cube = applyMoves(cube, sexy)
    expect(isSolved(cube)).toBe(true)
  })

  it('undoing a scramble restores the solved cube', () => {
    const moves = scramble('3', 30, seededRng(1))
    const scrambled = applyMoves(solvedCube(), moves)
    expect(isSolved(scrambled)).toBe(false)
    expect(isSolved(applyMoves(scrambled, invertMoves(moves)))).toBe(true)
  })

  it('has exactly 24 orientations', () => {
    expect(cubeOrientations(solvedCube())).toHaveLength(24)
    expect(cubeOrientations(solvedCube('2'))).toHaveLength(24)
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

  it('starts solved and a single turn unsolves it', () => {
    expect(isSolved(solvedCube('2'))).toBe(true)
    for (const move of ALL_MOVES) {
      expect(isSolved(applyMove(solvedCube('2'), move))).toBe(false)
    }
  })

  it('a move followed by its inverse is a no-op', () => {
    for (const move of ALL_MOVES) {
      const cube = applyMoves(solvedCube('2'), [move, ...invertMoves([move])])
      expect(isSolved(cube)).toBe(true)
    }
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
    // engine reads back through `inLayer`.
    const holds = (move: Move, shape: CubeShape) => {
      const dims = SHAPE_DIMS[shape]
      const range = moveLayerRange(move, dims)
      return layerCoords(faceLayers(dims, move.face)).filter((c) => inLayer(c, range))
    }
    expect(holds({ face: 'R', amount: 1 }, '4')).toEqual([3])
    expect(holds({ face: 'R', amount: 1, depth: 2 }, '4')).toEqual([1])
    expect(holds({ face: 'R', amount: 1, depth: 2, wide: true }, '4')).toEqual([1, 3])
    expect(holds({ face: 'L', amount: 1, depth: 2 }, '4')).toEqual([-1])
    expect(holds({ face: 'L', amount: 1 }, '3')).toEqual([-1])
    expect(holds({ face: 'U', amount: 1 }, '2')).toEqual([1])
    // Three layers do have an inner one (the M slice); two do not.
    expect(holds({ face: 'R', amount: 1, depth: 2 }, '3')).toEqual([0])
    expect(() => moveLayerRange({ face: 'R', amount: 1, depth: 2 }, SHAPE_DIMS['2'])).toThrow()
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

  it('has 24 orientations with distinct state keys', () => {
    const orientations = cubeOrientations(solvedCube('4'))
    expect(orientations).toHaveLength(24)
    expect(new Set(orientations.map(stateKey)).size).toBe(24)
    // stateKey must tell an inner slice turn apart from the solved state.
    const sliced = applyMove(solvedCube('4'), { face: 'R', amount: 1, depth: 2 })
    expect(stateKey(sliced)).not.toBe(stateKey(solvedCube('4')))
  })

  it('undoing a sliced scramble restores the solved cube', () => {
    const moves = scramble('4', 40, seededRng(11))
    const scrambled = applyMoves(solvedCube('4'), moves)
    expect(isSolved(scrambled)).toBe(false)
    expect(isSolved(applyMoves(scrambled, invertMoves(moves)))).toBe(true)
  })
})
