import { describe, expect, it } from 'vitest'
import { isBoxed, isSolved, solvedCube } from '@/lib/core/cube'
import { movesFor, scrambleTurns } from '@/lib/core/moves'
import { formatMove } from '@/lib/core/notation'
import { applyMove, applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'
import { cubeToEdit, emptyEdit, progress } from '@/lib/editor/edit'
import { paint } from '@/lib/editor/modes/colors'
import { formOf } from '@/lib/editor/modes/form'
import { normalIndex } from '@/lib/core/geometry'
import { validateCube } from '@/lib/editor/validate'
import { aBroken, solvePurple } from '@/lib/puzzles/twisted/purpleStates'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('purple')

/** Its outer turns: a half beyond the core (U, R, F's, wide) is the
 *  opposite one, held otherwise, so they reach every state as it stands. */
const OUTER = movesFor('purple').filter((m) => !m.wide)
const HALF = { depth: 4, wide: true } as const

/** A state entered as one would: its form, then each sticker painted (the
 *  editor completing what it can). */
function paintedIn(cube: Cube) {
  const form = formOf(cube)
  let edit = emptyEdit('purple', form)
  for (const c of cube) {
    for (const s of c.stickers) {
      edit = paint(edit, 'purple', c.position.join(), normalIndex(s.normal), s.color, form)
    }
  }
  return edit
}

/** What one sees of a state: where the big and the mini cubes stand
 *  (pieces of a kind are alike). */
const look = (cube: Cube) =>
  cube
    .map((c) => `${Math.abs(c.position[0]) % 2}:${c.position.join()}`)
    .sort()
    .join(' ')

describe("Meffert's Pocket Cube", () => {
  it('is 7 big violet cubes and the 8 minis of A, one hidden: its core', () => {
    const bigs = SOLVED.filter((c) => c.position.every((v) => Math.abs(v) % 2 === 1))
    expect(bigs).toHaveLength(7)
    expect(bigs.every((c) => c.stickers.length === 3)).toBe(true)
    const core = SOLVED.find((c) => c.position.every((v) => v === 0))!
    expect(core.stickers).toHaveLength(0)
  })

  it('turns, solved, its six halves, not the thin layers by A', () => {
    const allowed = movesFor('purple').filter((m) => turnAllowed(SOLVED, m))
    const layers = new Set(
      allowed.map((m) => formatMove({ ...m, amount: 1 }, undefined, undefined, 'purple')),
    )
    expect([...layers].sort()).toEqual(['B', 'D', 'F', 'L', 'R', 'U'])
    expect(allowed.filter((m) => m.face === 'U').every((m) => m.wide)).toBe(true)
  })

  it('turns its top half as its bottom one the other way, held otherwise', () => {
    // Both halves of an axis turned: the whole puzzle, solved still.
    const turned = applyMoves(SOLVED, [
      { face: 'U', amount: 1, ...HALF },
      { face: 'D', amount: 3 },
    ])
    expect(turned).not.toEqual(SOLVED)
    expect(isSolved(turned)).toBe(true)
  })

  it('is solved held any way, its turns named as it stands', () => {
    for (let seed = 0; seed < 5; seed++) {
      const scrambled = applyMoves(SOLVED, scrambleTurns('purple', 25, seededRng(seed), SOLVED))
      // Turned over by both halves of two axes.
      const held = applyMoves(scrambled, [
        { face: 'R', amount: 1, ...HALF },
        { face: 'L', amount: 3 },
        { face: 'F', amount: 2, ...HALF },
        { face: 'B', amount: 2 },
      ])
      const solution = solvePurple(held)
      let state = held
      for (const move of solution) {
        expect(turnAllowed(state, move)).toBe(true)
        state = applyMove(state, move)
      }
      expect(isSolved(state)).toBe(true)
    }
  })

  it('leaves its box with any turn, and comes back with four', () => {
    const L = { face: 'L', amount: 1 } as const
    const once = applyMove(SOLVED, L)
    expect(isSolved(once)).toBe(false)
    // A face jams once a big cube straddles its cut: D no longer turns.
    expect(turnAllowed(once, { face: 'D', amount: 1 })).toBe(false)
    expect(isSolved(applyMoves(SOLVED, [L, L, L, L]))).toBe(true)
  })

  it('takes 1160 shapes, none of them stuck, 13 turns apart at most', () => {
    const moves = OUTER
    const seen = new Set([look(SOLVED)])
    let frontier = [SOLVED]
    let depth = 0
    while (frontier.length) {
      const next: Cube[] = []
      for (const state of frontier) {
        const allowed = moves.filter((m) => turnAllowed(state, m))
        expect(allowed.length).toBeGreaterThan(0)
        for (const m of allowed) {
          const after = applyMove(state, m)
          if (seen.has(look(after))) continue
          seen.add(look(after))
          // Back in its box is back to the cube: there is only one.
          expect(isBoxed(after)).toBe(false)
          next.push(after)
        }
      }
      frontier = next
      if (next.length) depth++
    }
    expect(seen.size).toBe(1160)
    expect(depth).toBe(13)
  })

  it('takes 41760 states with the colors of A, 35 of them a cube but unsolved', () => {
    const moves = OUTER
    // The big cubes are alike: only where they stand counts, and A's minis.
    const key = (cube: Cube) =>
      cube
        .map(
          (c) =>
            c.position.join() +
            c.stickers
              .filter((s) => s.color !== 'V')
              .map((s) => s.normal.join() + s.color)
              .join(''),
        )
        .sort()
        .join(' ')
    const seen = new Set([key(SOLVED)])
    let frontier = [SOLVED]
    let depth = 0
    let cubes = 0
    while (frontier.length) {
      const next: Cube[] = []
      for (const state of frontier) {
        for (const m of moves) {
          if (!turnAllowed(state, m)) continue
          const after = applyMove(state, m)
          if (seen.has(key(after))) continue
          seen.add(key(after))
          // Solved in as many turns as it lies from solved: the fewest.
          const solution = solvePurple(after)
          expect(solution).toHaveLength(depth + 1)
          expect(isSolved(applyMoves(after, solution))).toBe(true)
          next.push(after)
          expect(isSolved(after)).toBe(false)
          if (isBoxed(after)) {
            cubes++
            // Each one can be painted in, sticker by sticker.
            expect(paintedIn(after)).toEqual(cubeToEdit(after))
          }
        }
      }
      frontier = next
      if (next.length) depth++
    }
    expect(seen.size).toBe(41760)
    expect(depth).toBe(30)
    expect(cubes).toBe(35)
  }, 30000)

  it('scrambles away from the cube, A broken up, wherever it starts', () => {
    for (let seed = 0; seed < 20; seed++) {
      for (const start of [SOLVED, applyMove(SOLVED, { face: 'L', amount: 1 })]) {
        const moves = scrambleTurns('purple', 25, seededRng(seed), start)
        expect(moves.length).toBeGreaterThanOrEqual(25)
        const after = applyMoves(start, moves)
        expect(aBroken(after)).toBe(true)
        expect(isBoxed(after)).toBe(false)
      }
    }
  })

  it('refuses, entered, two minis of A with their colors swapped', () => {
    // The minis of one color, on the right (lime) and on top (yellow).
    const swap = { L: 'Y', Y: 'L' } as const
    const swapped = SOLVED.map((c) =>
      c.stickers.length === 1 && c.stickers[0]!.color !== 'V'
        ? {
            ...c,
            stickers: c.stickers.map((s) =>
              s.color === 'L' || s.color === 'Y' ? { ...s, color: swap[s.color] } : s,
            ),
          }
        : c,
    )
    expect(validateCube(SOLVED)).toEqual({ ok: true })
    expect(validateCube(swapped)).toMatchObject({ ok: false, error: 'impossible' })
  })

  it('is painted in as it stands, scrambled, sticker by sticker', () => {
    for (let seed = 0; seed < 10; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('purple', 25, seededRng(seed), SOLVED))
      expect(paintedIn(cube)).toEqual(cubeToEdit(cube))
    }
  })

  it('is entered with its big cubes already violet: only A to paint', () => {
    // In its box, A's three minis of one sticker can only stand home: set too.
    expect(progress(emptyEdit('purple'), 'purple')).toMatchObject({ filled: 24, total: 33 })
  })

  it('is written like a cube, its thin layers by A in lowercase', () => {
    const write = (move: Move) => formatMove(move, undefined, undefined, 'purple')
    expect(write({ face: 'L', amount: 3 })).toBe("L'")
    expect(write({ face: 'U', amount: 1, ...HALF })).toBe('U')
    expect(write({ face: 'R', amount: 2 })).toBe('r2')
  })
})
