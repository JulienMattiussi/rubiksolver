import { describe, expect, it } from 'vitest'
import { applyMove, applyMoves, cubeOrientations, cubeSize, isSolved, solvedCube } from '@/lib/cube'
import { ALL_MOVES, invertMoves, parseMoves, scramble } from '@/lib/moves'
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
    const moves = scramble(30, seededRng(1))
    const scrambled = applyMoves(solvedCube(), moves)
    expect(isSolved(scrambled)).toBe(false)
    expect(isSolved(applyMoves(scrambled, invertMoves(moves)))).toBe(true)
  })

  it('has exactly 24 orientations', () => {
    expect(cubeOrientations(solvedCube())).toHaveLength(24)
    expect(cubeOrientations(solvedCube(2))).toHaveLength(24)
  })
})

describe('2x2 cube engine', () => {
  it('has 8 corner cubies in {-1,1}^3', () => {
    const cube = solvedCube(2)
    expect(cube).toHaveLength(8)
    expect(cubeSize(cube)).toBe(2)
    expect(cubeSize(solvedCube())).toBe(3)
    expect(cube.every((c) => c.stickers.length === 3)).toBe(true)
    expect(cube.every((c) => c.position.every((v) => v === 1 || v === -1))).toBe(true)
  })

  it('starts solved and a single turn unsolves it', () => {
    expect(isSolved(solvedCube(2))).toBe(true)
    for (const move of ALL_MOVES) {
      expect(isSolved(applyMove(solvedCube(2), move))).toBe(false)
    }
  })

  it('a move followed by its inverse is a no-op', () => {
    for (const move of ALL_MOVES) {
      const cube = applyMoves(solvedCube(2), [move, ...invertMoves([move])])
      expect(isSolved(cube)).toBe(true)
    }
  })

  it("treats a reoriented solved cube as solved (R L' spins the whole 2x2)", () => {
    // On a 2x2, R and L' rotate the two layers the same way: the cube ends
    // solved but reoriented, which the uniform-faces rule must accept.
    expect(isSolved(applyMoves(solvedCube(2), parseMoves("R L'")))).toBe(true)
  })
})
