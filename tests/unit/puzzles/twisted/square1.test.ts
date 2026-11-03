import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { invertMoves } from '@/lib/core/moves'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Cubie, SectorMove } from '@/lib/core/types'
import { buildCube, cubeToEdit, isComplete } from '@/lib/editor/edit'
import { lookOf } from '@/lib/editor/modes/form'
import { validateCube } from '@/lib/editor/validate'
import { INSERT_CORNER, INSERT_EDGE, isCube } from '@/lib/methods/twisted/square1Kit'
import { PARITY, SWAP_TOP_CORNERS, TOP_EDGES } from '@/lib/methods/twisted/square1CornersFirst'
import {
  SWAP_NEIGHBOR_EDGES,
  SWAP_OPPOSITE_EDGES,
  SWAP_RIGHT_CORNERS,
  SQUARE_MIDDLE,
  TURN_MIDDLE,
} from '@/lib/methods/twisted/square1FaceFirst'
import { sectorFaced, sectorPlace } from '@/lib/puzzles/shared/sectors'
import { scrambleSquare1 } from '@/lib/puzzles/twisted/square1'
import { SQUARE1_FORM_STAGES } from '@/lib/puzzles/twisted/square1Entry'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('square1')
const U = (steps: number): SectorMove => ({ layer: 'U', steps: steps as 1 })
const SLASH: SectorMove = { flip: true }

describe('the Square-1', () => {
  it('is built solved and recognized', () => {
    expect(cubeShape(SOLVED)).toBe('square1')
    expect(isSolved(SOLVED)).toBe(true)
  })

  it('slashes only when no corner lies across its cut', () => {
    expect(turnAllowed(SOLVED, SLASH)).toBe(true)
    // Two twelfths turned: a corner across the cut; one, none.
    expect(turnAllowed(applyMoves(SOLVED, [U(2)]), SLASH)).toBe(false)
    expect(turnAllowed(applyMoves(SOLVED, [U(1)]), SLASH)).toBe(true)
    // A quarter: an edge and a corner swap sides, the cut clean.
    expect(turnAllowed(applyMoves(SOLVED, [U(3)]), SLASH)).toBe(true)
  })

  it('is no longer solved after a slash, nor after a quarter of its top', () => {
    expect(isSolved(applyMoves(SOLVED, [SLASH]))).toBe(false)
    expect(isSolved(applyMoves(SOLVED, [U(3)]))).toBe(false)
    expect(isSolved(applyMoves(SOLVED, [SLASH, SLASH]))).toBe(true)
  })

  it('scrambles through slashes that can go, undone by their inverse', () => {
    const moves = scrambleSquare1(30, seededRng(1), SOLVED)
    let state = SOLVED
    for (const move of moves) {
      expect(turnAllowed(state, move)).toBe(true)
      state = applyMoves(state, [move])
    }
    expect(isSolved(state)).toBe(false)
    expect(isSolved(applyMoves(state, invertMoves(moves)))).toBe(true)
  })
})

/** Where each piece stands, named as the pages name places: its layer (H,
 *  B) and the sides it faces (D right, A front, G left, P back). */
const SIDE_NAMES: Record<number, string> = { 2: 'D', 5: 'A', 8: 'G', 11: 'P' }
function placeName(c: Cubie): string {
  const place = sectorPlace(c.position)!
  const sides = c.stickers.flatMap((s) => {
    const m = sectorFaced(s.normal)
    return m === undefined ? [] : [SIDE_NAMES[m] ?? `?${m}`]
  })
  return (place.z > 0 ? 'H' : 'B') + sides.sort().join('')
}

/** What a formula does from the solved puzzle, every slash going: each
 *  layer piece that moved, from its place to where it went. */
function effect(moves: readonly SectorMove[]): string[] {
  let state = SOLVED
  for (const move of moves) {
    expect(turnAllowed(state, move)).toBe(true)
    state = applyMoves(state, [move])
  }
  return SOLVED.flatMap((c, i) => {
    if (!sectorPlace(c.position)) return []
    const [from, to] = [placeName(c), placeName(state[i]!)]
    return from === to ? [] : [`${from}->${to}`]
  }).sort()
}

describe('the Square-1 formulas, as their pages say', () => {
  it('fan2cube: corners first (squareone2)', () => {
    expect(effect(INSERT_CORNER)).toContain('HAD->BAD')
    expect(effect(SWAP_TOP_CORNERS)).toEqual(['HAG->HGP', 'HG->HP', 'HGP->HAG', 'HP->HG'])
    expect(effect(INSERT_EDGE)).toContain('HD->BD')
    expect(effect(TOP_EDGES)).toEqual(['HD->HP', 'HG->HD', 'HP->HG'])
  })

  it('francocube: face by face', () => {
    expect(effect(SWAP_RIGHT_CORNERS)).toEqual(['HA->HD', 'HAD->HDP', 'HD->HA', 'HDP->HAD'])
    expect(effect(SWAP_NEIGHBOR_EDGES)).toEqual(['BA->BG', 'BG->BA', 'HA->HG', 'HG->HA'])
    expect(effect(SWAP_OPPOSITE_EDGES)).toEqual(['HA->HP', 'HP->HA'])
  })

  it('francocube: the middle, squared or turned round', () => {
    // From a cube, /(6,0)/(6,0)/ flips the middle only, its layers a cube.
    const flipped = applyMoves(SOLVED, SQUARE_MIDDLE)
    expect(isCube(flipped, false)).toBe(true)
    expect(isCube(flipped, true)).toBe(false)
    // (1,-1)/(6,6)/ swaps the layers over a square middle.
    const swapped = applyMoves(SOLVED, TURN_MIDDLE)
    expect(isCube(swapped, true)).toBe(true)
    expect(effect(TURN_MIDDLE).every((m) => m[0] !== m[m.indexOf('>') + 1])).toBe(true)
  })

  it('the parity: two top edges swapped, all else in place but the middle', () => {
    const moved = effect(PARITY)
    expect(moved).toHaveLength(2)
    expect(moved.every((m) => /^H[A-Z]->H[A-Z]$/.test(m))).toBe(true)
  })
})

describe('the Square-1 entered in three stages', () => {
  it('offers its 29 outlines on top, and every shape its turns reach', () => {
    const tops = SQUARE1_FORM_STAGES.options(0, [])
    expect(tops).toHaveLength(29)
    const pairs = tops.flatMap((top) =>
      SQUARE1_FORM_STAGES.options(1, [{ key: top.key, way: 0 }]).map((bottom) => [top, bottom]),
    )
    expect(pairs).toHaveLength(170)
  })

  it('finds the stages a state stands in, and builds that very shape back', () => {
    for (const seed of [1, 2, 3]) {
      const cube = applyMoves(SOLVED, scrambleSquare1(30, seededRng(seed), SOLVED))
      const picks = SQUARE1_FORM_STAGES.of(cube)
      expect(lookOf(SQUARE1_FORM_STAGES.form(picks))).toBe(lookOf(cube))
    }
  })

  it('takes its pieces put on the shape the stages built, and validates it', () => {
    const cube = applyMoves(SOLVED, scrambleSquare1(30, seededRng(4), SOLVED))
    const form = SQUARE1_FORM_STAGES.form(SQUARE1_FORM_STAGES.of(cube))
    // The colors as entered on that form: each slot the piece standing there.
    const edit = cubeToEdit(cube)
    expect(isComplete(edit, 'square1', form)).toBe(true)
    expect(validateCube(buildCube(edit, 'square1', form))).toEqual({ ok: true })
  })
})
