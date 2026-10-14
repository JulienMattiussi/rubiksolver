import { describe, expect, it } from 'vitest'
import {
  cubeOrientations,
  cubeShape,
  isSolved,
  solvedCube,
  stateKey,
  stickersTotal,
} from '@/lib/cube'
import { buildCube, cubeToEdit, emptyEdit, isComplete, progress } from '@/lib/editor'
import { stickerId, tablesFor } from '@/lib/editorTables'
import { formOf } from '@/lib/forms'
import { normalIndex } from '@/lib/geometry'
import { describeMove, moveGuide } from '@/lib/moveGuide'
import {
  formatMove,
  invertMoves,
  layerTurnsOf,
  sameLayer,
  NOTATION_FR,
  NOTATION_US,
  scrambleTurns,
} from '@/lib/moves'
import { methodsFor } from '@/lib/solver'
import { decodeCube, encodeCube } from '@/lib/snapshot'
import { applyMoves, turnAllowed } from '@/lib/turn'
import { hasColoredClips, isGear, type Cube, type CubeShape, type Turn } from '@/lib/types'
import { alignGears } from '@/lib/gear'
import { gearColorsOf, turnedOf } from '@/lib/gearEditor'
import { validateCube } from '@/lib/validate'
import { barsTurned } from '@/lib/roadblock'
import { LOCALES } from '@/i18n/translations'
import { seededRng } from '../helpers'

/**
 * What every puzzle must satisfy, whatever its shape: built and recognized,
 * every turn undone by its inverse, its whole-puzzle orientations, scrambles
 * solved by each of its methods (held any way up), the editor and the
 * snapshots round-tripping a scrambled state, a guide naming every turn.
 *
 * A new puzzle adds one row here; its own test file only keeps what is its
 * own (notation, the effect of its formulas, its method's move sets).
 */
const PUZZLES: ReadonlyArray<{
  shape: CubeShape
  pieces: number
  stickers: number
  orientations: number
  /** Stickers the editor counts: the visible ones. */
  painted: number
  scramble: number
}> = [
  { shape: '2', pieces: 8, stickers: 24, orientations: 24, painted: 24, scramble: 11 },
  { shape: '3', pieces: 27, stickers: 54, orientations: 24, painted: 54, scramble: 25 },
  { shape: '4', pieces: 64, stickers: 96, orientations: 24, painted: 96, scramble: 40 },
  { shape: 'super4', pieces: 64, stickers: 144, orientations: 24, painted: 144, scramble: 40 },
  { shape: '5', pieces: 125, stickers: 150, orientations: 24, painted: 150, scramble: 60 },
  { shape: 'super5', pieces: 125, stickers: 246, orientations: 24, painted: 246, scramble: 60 },
  { shape: '6', pieces: 216, stickers: 216, orientations: 24, painted: 216, scramble: 80 },
  { shape: '123', pieces: 6, stickers: 22, orientations: 4, painted: 22, scramble: 10 },
  { shape: '223', pieces: 12, stickers: 32, orientations: 8, painted: 32, scramble: 20 },
  { shape: '224', pieces: 16, stickers: 40, orientations: 8, painted: 40, scramble: 25 },
  // A 4x4x4 two pieces tall: shifts shape, turns by blocks out of its box.
  { shape: 'camo', pieces: 32, stickers: 64, orientations: 8, painted: 64, scramble: 40 },
  { shape: '331', pieces: 9, stickers: 30, orientations: 8, painted: 30, scramble: 12 },
  { shape: '332', pieces: 18, stickers: 42, orientations: 8, painted: 42, scramble: 20 },
  { shape: 'pyra', pieces: 15, stickers: 36, orientations: 12, painted: 36, scramble: 11 },
  // The Pyraminx without its tips.
  { shape: 'tetra', pieces: 11, stickers: 24, orientations: 12, painted: 24, scramble: 11 },
  { shape: 'pyra4', pieces: 30, stickers: 64, orientations: 12, painted: 64, scramble: 30 },
  { shape: 'pyra5', pieces: 54, stickers: 100, orientations: 12, painted: 100, scramble: 40 },
  { shape: 'jing', pieces: 15, stickers: 28, orientations: 12, painted: 28, scramble: 15 },
  // A 3x3x3 cut to a tetrahedron, its centers marked.
  { shape: 'mmorph', pieces: 27, stickers: 60, orientations: 24, painted: 60, scramble: 25 },
  { shape: 'morph', pieces: 8, stickers: 16, orientations: 24, painted: 16, scramble: 11 },
  { shape: 'oct4', pieces: 56, stickers: 56, orientations: 24, painted: 56, scramble: 40 },
  { shape: 'vto', pieces: 24, stickers: 72, orientations: 24, painted: 72, scramble: 25 },
  { shape: 'gem', pieces: 18, stickers: 54, orientations: 24, painted: 54, scramble: 25 },
  // A dodecahedron: 12 fixed centers, 30 edges, 20 corners.
  { shape: 'megaminx', pieces: 62, stickers: 132, orientations: 60, painted: 132, scramble: 40 },
  // The Megaminx cut deeper: no centers, a hidden core.
  { shape: 'crystal', pieces: 51, stickers: 120, orientations: 60, painted: 120, scramble: 40 },
  // The Megaminx without its centers.
  { shape: 'holey', pieces: 50, stickers: 120, orientations: 60, painted: 120, scramble: 40 },
  { shape: 'rainbow', pieces: 20, stickers: 56, orientations: 24, painted: 56, scramble: 20 },
  // Held three ways: about its diagonal through A, its one symmetry.
  {
    shape: 'violet',
    pieces: 15,
    stickers: 33,
    orientations: 3,
    painted: 33,
    scramble: 25,
  },
  { shape: 'dino', pieces: 12, stickers: 24, orientations: 24, painted: 24, scramble: 20 },
  { shape: 'dinoCyl', pieces: 20, stickers: 48, orientations: 24, painted: 48, scramble: 25 },
  // A 3x3 cut to a cube turned an eighth, its side centers marked.
  { shape: 'fisher', pieces: 27, stickers: 58, orientations: 24, painted: 58, scramble: 20 },
  { shape: 'windmill', pieces: 27, stickers: 62, orientations: 24, painted: 62, scramble: 20 },
  // A Skewb cut out of a dodecahedron.
  { shape: 'skewbU', pieces: 14, stickers: 48, orientations: 12, painted: 48, scramble: 25 },
  { shape: 'rex', pieces: 42, stickers: 54, orientations: 24, painted: 54, scramble: 25 },
  // A 3x3 without its corners.
  { shape: 'tori', pieces: 19, stickers: 30, orientations: 24, painted: 30, scramble: 20 },
  // A 3x3's edges alone.
  { shape: 'edge', pieces: 13, stickers: 24, orientations: 24, painted: 24, scramble: 20 },
  // A 3x3 whose faces turn by alternate quarters.
  // A 4x4x4, four of its octants fused in quincunx.
  { shape: 'ai', pieces: 32, stickers: 60, orientations: 24, painted: 60, scramble: 30 },
  { shape: 'fto', pieces: 42, stickers: 72, orientations: 24, painted: 72, scramble: 30 },
  {
    shape: 'roadblock',
    pieces: 125,
    stickers: 204,
    orientations: 24,
    painted: 150,
    scramble: 40,
  },
  { shape: 'quarter', pieces: 27, stickers: 54, orientations: 24, painted: 54, scramble: 30 },
  // A 3x3 cut to an octagonal prism, its hidden core left out.
  { shape: 'barrel', pieces: 26, stickers: 54, orientations: 24, painted: 54, scramble: 20 },
  { shape: 'twist', pieces: 27, stickers: 54, orientations: 24, painted: 54, scramble: 20 },
  { shape: 'ghost', pieces: 11, stickers: 36, orientations: 1, painted: 36, scramble: 15 },
  // Two layers of twelve round a center in two halves.
  { shape: 'puck', pieces: 26, stickers: 48, orientations: 1, painted: 48, scramble: 25 },
  {
    shape: 'gearCube',
    pieces: 27,
    stickers: 54,
    orientations: 24,
    painted: 54,
    scramble: 20,
  },
  {
    shape: 'gearU',
    pieces: 27,
    stickers: 54,
    orientations: 24,
    painted: 54,
    scramble: 20,
  },
  {
    shape: 'gearX',
    pieces: 27,
    stickers: 54,
    orientations: 24,
    painted: 54,
    scramble: 25,
  },

  { shape: 'star', pieces: 14, stickers: 40, orientations: 12, painted: 40, scramble: 30 },
  // The 4-star's inner points hide a face each: 12 stickers never seen.
  { shape: 'star4', pieces: 26, stickers: 76, orientations: 12, painted: 64, scramble: 40 },
]

/**
 * The ways one can hold a puzzle and enter it: its orientations that keep
 * its fixed pieces (pre-filled in the editor: the 3x3's centers, a Floppy's,
 * a star's left screw half) as they are. A 3x3 takes any (the editor turns
 * it whole first); the others are entered as they come.
 */
function heldWays(cube: Cube, shape: CubeShape): Cube[] {
  const fixed = tablesFor(shape).slots.filter((s) => !s.paintable && s.stickers.length)
  const colors = (c: Cube) => {
    const edit = Object.fromEntries(
      c.flatMap((p) =>
        p.stickers.map((s) => [stickerId(p.position, normalIndex(s.normal)), s.color]),
      ),
    )
    return fixed.flatMap((slot) => slot.stickers.map((s) => edit[s.id])).join()
  }
  const all = cubeOrientations(cube)
  if (shape === '3') return all
  // The Gear Cube Extreme only upright or upside down: its free top and
  // bottom are its mechanism's.
  if (shape === 'gearX') {
    const middle = (c: Cube) =>
      c
        .filter((p) => p.stickers.length === 2 && p.spin === undefined)
        .every((p) => p.position[1] === 0)
    return all.filter(middle)
  }
  return all.filter((o) => colors(o) === colors(cube))
}

const amountOf = (turn: Turn): number => ('amount' in turn ? turn.amount : 0)

const scrambled = (shape: CubeShape, length: number, seed: number) => {
  const solved = solvedCube(shape)
  return applyMoves(solved, scrambleTurns(shape, length, seededRng(seed), solved))
}

describe.each(PUZZLES)('$shape', ({ shape, pieces, stickers, orientations, painted, scramble }) => {
  const SOLVED = solvedCube(shape)

  it('is built solved and recognized by its pieces', () => {
    expect(SOLVED).toHaveLength(pieces)
    expect(stickersTotal(shape)).toBe(stickers)
    expect(cubeShape(SOLVED)).toBe(shape)
    expect(isSolved(SOLVED)).toBe(true)
  })

  it('unsolves with any turn, which its inverse undoes', () => {
    const turns = layerTurnsOf(shape).filter((t) => turnAllowed(SOLVED, t))
    expect(turns.length).toBeGreaterThan(0)
    for (const turn of turns) {
      const there = applyMoves(SOLVED, [turn])
      expect(isSolved(there)).toBe(false)
      expect(stateKey(applyMoves(there, invertMoves([turn])))).toBe(stateKey(SOLVED))
    }
  })

  it('has its whole-puzzle orientations, all solved', () => {
    const all = cubeOrientations(SOLVED)
    expect(all).toHaveLength(orientations)
    expect(new Set(all.map(stateKey)).size).toBe(orientations)
    expect(all.every(isSolved)).toBe(true)
  })

  it('comes back from a scramble undone, and through a snapshot', () => {
    const solved = solvedCube(shape)
    const moves = scrambleTurns(shape, scramble, seededRng(5), solved)
    const cube = applyMoves(solved, moves)
    expect(stateKey(applyMoves(cube, invertMoves(moves)))).toBe(stateKey(solved))
    expect(stateKey(decodeCube(encodeCube(cube))!)).toBe(stateKey(cube))
  })

  it('is solved by each of its methods, held any way up, in named steps', () => {
    const methods = methodsFor(shape)
    expect(methods.length).toBeGreaterThan(0)
    for (const [k, method] of methods.entries()) {
      for (const locale of Object.values(LOCALES)) {
        expect(locale.methods[method.id].name).toBeTruthy()
        expect(locale.methods[method.id].desc).toBeTruthy()
      }
      const cube = scrambled(shape, scramble, 100 + k)
      const held = heldWays(cube, shape)
      for (const start of [cube, held[held.length - 1]!]) {
        const steps = method.solve(start)
        for (const step of steps) {
          expect(step.moves.length).toBeGreaterThan(0)
          for (const locale of Object.values(LOCALES)) {
            expect((locale.steps as Record<string, string>)[step.key]).toBeTruthy()
          }
        }
        expect(
          isSolved(
            applyMoves(
              start,
              steps.flatMap((s) => [...s.moves]),
            ),
          ),
        ).toBe(true)
      }
    }
  }, 60000)

  it('goes through the editor and back, every sticker counted', () => {
    expect(progress(emptyEdit(shape), shape).total).toBe(painted)
    expect(progress(cubeToEdit(SOLVED), shape)).toMatchObject({ filled: painted, total: painted })
    for (let seed = 0; seed < 3; seed++) {
      const mixed = scrambled(shape, scramble, seed)
      // A Gear Cube is entered in the cube's shape, its gears aligned.
      // (The Extreme's gears each spin on their own: its gear moves thrice.)
      const cube =
        shape === 'gearX'
          ? applyMoves(
              SOLVED,
              scrambleTurns(shape, scramble, seededRng(seed), SOLVED).flatMap((m): Turn[] =>
                'gear' in m ? [m, m, m] : [m],
              ),
            )
          : isGear(shape)
            ? applyMoves(mixed, alignGears(mixed))
            : mixed
      // A shape-shifting puzzle is entered in the form it stands in.
      const form = formOf(cube)
      const edit = cubeToEdit(cube)
      expect(isComplete(edit, shape, form)).toBe(true)
      // A Gear Cube's gears, painted apart: some turned over on their clips.
      const turned = hasColoredClips(shape)
        ? turnedOf(gearColorsOf(cube), edit, shape)!
        : shape === 'roadblock'
          ? barsTurned(cube)
          : cube
              .filter((c) => c.spin === 1 && c.stickers.length === 1)
              .map((c) => c.position.join(','))
      const built = buildCube(edit, shape, form, turned)
      expect(cubeToEdit(built)).toEqual(edit)
      expect(validateCube(built)).toEqual({ ok: true })
    }
  }, 120000)

  it('guides every turn it has, named and described in both languages and notations', () => {
    const turns = moveGuide(shape).flatMap((g) => g.rows.flat())
    for (const turn of layerTurnsOf(shape)) {
      expect(turns.some((t) => sameLayer(t, turn) && amountOf(t) === amountOf(turn))).toBe(true)
    }
    for (const turn of turns) {
      for (const labels of [NOTATION_US, NOTATION_FR]) expect(formatMove(turn, labels)).toBeTruthy()
      for (const locale of Object.values(LOCALES)) {
        expect(locale.describeMove(describeMove(turn, shape))).not.toMatch(/undefined|NaN/)
      }
    }
  })
})
