import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { MEGA_AXES, MEGA_FACES, megaAround, megaSlotAt } from '@/lib/puzzles/polyhedron/megaminx'
import { megaFormula } from '@/lib/methods/polyhedron/megaminxFormulas'
import {
  CORNER,
  SIDE_CORNERS,
  STAR,
  EQUATOR,
  TOP_CORNERS,
  TOP_EDGES,
  TOP_FLIP,
  TOP_TWIST,
} from '@/lib/methods/polyhedron/megaminxFormulas'
import { formatMove, NOTATION_FR } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { scrambleTurns } from '@/lib/core/moves'
import { methodsFor } from '@/lib/solve/solver'
import { MEGA_IN_SIGHT } from '@/lib/puzzles/polyhedron/megaSight'
import { isMegaMove } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { seededRng } from '../../../helpers'
import { HOME_POSITION } from '@/three/core/camera'
import type { MegaMove } from '@/lib/core/types'
import { invertMegaMove as invert } from '@/lib/puzzles/polyhedron/megaminx'

const SOLVED = solvedCube('megaminx')

/** fan2cube's names of the faces, held with A in front and H above it. */
const PAGE: Record<string, string> = { U: 'H', F: 'A', R: 'D', L: 'G', BR: 'P', BL: 'b', DR: 'B' }
const name = (p: readonly number[]) =>
  megaSlotAt(p as [number, number, number])
    .map((f) => PAGE[f] ?? f)
    .sort((x, y) => 'HADGPbB'.indexOf(x) - 'HADGPbB'.indexOf(y))
    .join('')

/** What a formula does from the solved puzzle, on edges or corners:
 *  `(HA)->(HP)`, or `(HA)°` turned in place. */
function effect(formula: string, size: 2 | 3): string[] {
  const cube = applyMoves(SOLVED, megaFormula(formula))
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (home.stickers.length !== size) return []
      if (c.position.join() !== home.position.join()) {
        return [`(${name(home.position)})->(${name(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${name(home.position)})°`] : []
    })
    .sort()
}

describe('Megaminx', () => {
  it('turns a face back in five fifths', () => {
    const turn: MegaMove = { megaFace: 'BL', amount: 1 }
    expect(isSolved(applyMoves(SOLVED, [turn, turn, turn, turn]))).toBe(false)
    expect(isSolved(applyMoves(SOLVED, [turn, turn, turn, turn, turn]))).toBe(true)
  })

  // A face's ring tells where its turn carries the pieces and how a scan
  // reads it: each one clockwise seen from outside, as the 3D view turns it
  // (the bottom's was the other way round, 2026-11-05).
  it('rings each face clockwise seen from it, as drawn', () => {
    const cross = (a: readonly number[], b: readonly number[]) => [
      a[1]! * b[2]! - a[2]! * b[1]!,
      a[2]! * b[0]! - a[0]! * b[2]!,
      a[0]! * b[1]! - a[1]! * b[0]!,
    ]
    for (const face of MEGA_FACES) {
      const ring = megaAround(face)
      ring.forEach((g, i) => {
        const turn = cross(MEGA_AXES[g], MEGA_AXES[ring[(i + 1) % 5]!])
        expect(turn.reduce((sum, v, k) => sum + v * MEGA_AXES[face][k]!, 0)).toBeLessThan(0)
      })
    }
  })

  it('writes its turns as fan2cube does, underlining the far faces', () => {
    expect(formatMove({ megaFace: 'F', amount: 2 }, NOTATION_FR)).toBe('A2')
    expect(formatMove({ megaFace: 'D', amount: 4 }, NOTATION_FR)).toBe("H̲'")
    expect(formatMove({ megaFace: 'DBL', amount: 3 })).toBe("DBL2'")
  })

  it('does what fan2cube.fr says of each formula', () => {
    // A.H'DH turns the edge (HA) over, its star built on H.
    expect(effect(STAR[1]!, 2)).toContain('(HA)°')
    // HDH'D' takes the corner (BAD) up to (HDA), the last of a face.
    expect(effect(SIDE_CORNERS[4]!, 3)).toContain('(ADB)->(HAD)')
    // D'B'D: (BAD) -> (HDA).
    expect(effect(CORNER[0]!, 3)).toContain('(ADB)->(HAD)')
    // [H'A'][HD]: (HD) -> (AD); [HD][H'A']: (HA) -> (AD).
    expect(effect(EQUATOR[0]!, 2)).toContain('(HD)->(AD)')
    expect(effect(EQUATOR[1]!, 2)).toContain('(HA)->(AD)')
    expect(effect(TOP_EDGES[0]!, 2)).toEqual(['(HA)->(HP)', '(HD)->(HA)', '(HP)->(HD)'])
    expect(effect(TOP_FLIP[0]!, 2)).toEqual(['(HA)°', '(HD)°'])
    expect(effect(TOP_CORNERS[0]!, 3)).toEqual(['(HAD)->(HDP)', '(HDP)->(HPb)', '(HPb)->(HAD)'])
    expect(effect(TOP_TWIST[0]!, 3)).toEqual(['(HAD)°', '(HAG)°'])
    // The last two leave the rest alone.
    for (const formula of [...TOP_CORNERS, ...TOP_TWIST]) {
      expect(effect(formula, 2)).toEqual([])
    }
  })

  it('turns whole in hand, nothing moved on it', () => {
    const turned = applyMoves(SOLVED, [{ megaFace: 'U', amount: 2, whole: true }])
    expect(isSolved(turned)).toBe(true)
    expect(formatMove({ megaFace: 'DR', amount: 2, whole: true }, NOTATION_FR)).toBe('x2')
    // Never merged with a turn of its face.
    const both: MegaMove[] = [
      { megaFace: 'U', amount: 1, whole: true },
      { megaFace: 'U', amount: 1 },
    ]
    expect(isSolved(applyMoves(SOLVED, [...both, ...both.map(invert).reverse()]))).toBe(true)
  })

  // In sight: the faces turned toward the view the puzzle opens in, well
  // enough (the left, the back right, the lower left and back right are
  // seen edge on).
  it('says which faces the view it opens in shows', () => {
    const view = HOME_POSITION.clone().normalize()
    const seen = MEGA_FACES.filter((f) => view.dot(new Vector3(...MEGA_AXES[f])) > 0.3)
    expect([...seen].sort()).toEqual([...MEGA_IN_SIGHT].sort())
  })

  // A turn behind is brought in sight first: the puzzle turned about the
  // vertical, or the face beneath tipped in front.
  it.each<CubeShape>(['megaminx', 'holey', 'crystal'])(
    'solves a %s with every turn in sight',
    (shape) => {
      const cube = applyMoves(
        solvedCube(shape),
        scrambleTurns(shape, 30, seededRng(3), solvedCube(shape)),
      )
      const moves = methodsFor(shape)[0]!
        .solve(cube)
        .flatMap((s) => s.moves)
      const turns = moves.filter(isMegaMove)
      expect(turns.some((t) => t.whole)).toBe(true)
      expect(turns.filter((t) => !t.whole && !MEGA_IN_SIGHT.includes(t.megaFace))).toEqual([])
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
    },
  )

  // Played in hand some steps, turned whole on the way (the face beneath
  // tipped in front), then solved again: from where it stands, the steps
  // done not begun again from the face now beneath.
  it.each<CubeShape>(['megaminx', 'holey'])(
    'picks a %s up where its solution was left',
    (shape) => {
      const cube = applyMoves(
        solvedCube(shape),
        scrambleTurns(shape, 40, seededRng(1), solvedCube(shape)),
      )
      const steps = methodsFor(shape)[0]!.solve(cube)
      const played = steps.slice(0, 4).flatMap((s) => s.moves)
      expect(played.some((t) => isMegaMove(t) && t.whole && t.megaFace === 'DR')).toBe(true)
      const again = methodsFor(shape)[0]!.solve(applyMoves(cube, played))
      expect(again[0]!.key).toBe(steps[4]!.key)
    },
  )
})
