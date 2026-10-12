import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/cube'
import { buildCube, cubeToEdit, emptyEdit, isComplete } from '@/lib/editor'
import { GHOST_SLOTS, GHOST_TURNS, parseGhostMoves } from '@/lib/ghost'
import { CYCLE_CORNERS, FLIP_EDGES, TURN_CORNERS } from '@/lib/methods/ghost'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import { nextPiece, piecesIn, placedCount } from '@/lib/pieceEditor'
import { cubieAt } from '@/lib/pieces'
import { applyMove, applyMoves } from '@/lib/turn'
import type { Cube, Cubie, GhostMove } from '@/lib/types'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('ghost')

/** Every reachable state with its distance from solved. */
function stateSpace(): Map<string, { cube: Cube; depth: number }> {
  const seen = new Map([[stateKey(SOLVED), { cube: SOLVED, depth: 0 }]])
  let frontier: Cube[] = [SOLVED]
  for (let depth = 1; frontier.length; depth++) {
    const next: Cube[] = []
    for (const cube of frontier) {
      for (const move of GHOST_TURNS) {
        const turned = applyMove(cube, move)
        const key = stateKey(turned)
        if (seen.has(key)) continue
        seen.set(key, { cube: turned, depth })
        next.push(turned)
      }
    }
    frontier = next
  }
  return seen
}

const pieceKey = (c: Cubie) =>
  `${c.position.join()}:${c.stickers.map((s) => s.normal.join()).join('|')}`

/** What a formula does from solved, slot by slot (slot index m, see ghost.ts):
 *  `m<-n` the piece of slot n came to m, `~` it lies the other way. */
function effect(moves: readonly GhostMove[]): string[] {
  const cube = applyMoves(SOLVED, moves)
  return cube.flatMap((piece, i) => {
    const home = SOLVED[i]!
    if (pieceKey(piece) === pieceKey(home)) return []
    const from = GHOST_SLOTS.findIndex((p) => p.join() === home.position.join())
    const to = GHOST_SLOTS.findIndex((p) => p.join() === piece.position.join())
    const upright = piece.stickers.find((s) => s.normal[2] !== 0)!.normal[2] === 1
    return [`${to}<-${from}${upright ? '' : '~'}`]
  })
}

describe('Floppy Ghost', () => {
  it('writes its turns in either notation, and reads fan2cube formulas', () => {
    expect(formatMoves(GHOST_TURNS, NOTATION_FR)).toBe('H2 D2 B2 P2 G2')
    expect(formatMoves(GHOST_TURNS, NOTATION_US)).toBe('U2 R2 D2 B2 L2')
    expect(formatMoves(parseGhostMoves('(H²D²)^3'), NOTATION_FR)).toBe('H2 D2 H2 D2 H2 D2')
  })

  it('has 30720 states within 15 turns, the solved one alone solved', () => {
    // fan2cube.fr counts 5!.2^5/2 = 1920, leaving out how the corners lie:
    // its own method turns them over (twice 2^4, the flips going by pairs).
    const space = stateSpace()
    expect(space.size).toBe(30720)
    expect(Math.max(...[...space.values()].map((s) => s.depth))).toBe(15)
    expect([...space.values()].filter((s) => isSolved(s.cube))).toHaveLength(1)
  }, 20000)

  it('flips a side over: its edge in place, its two corners swapped', () => {
    expect(effect([{ side: 'U' }])).toEqual(['0<-0~', '9<-1~', '1<-9~'])
  })

  it('cycles three corners with (H2 D2)2, the edges untouched', () => {
    // Top left to top right to lower right, as the page's arrows go.
    expect(effect(CYCLE_CORNERS)).toEqual(['3<-1~', '9<-3', '1<-9~'])
  })

  it('turns the two top corners over with D2 B2 P2 G2 P2 B2 D2 H2, and flips two edges', () => {
    expect(effect(TURN_CORNERS)).toEqual(['0<-0~', '8<-8~', '1<-1~', '9<-9~'])
  })

  it('flips the top and right edges with (H2 D2)3, nothing else', () => {
    expect(effect(FLIP_EDGES)).toEqual(['0<-0~', '2<-2~'])
  })

  it('never moves its center, and keeps every edge in its slot', () => {
    for (const { cube } of stateSpace().values()) {
      expect(cube[0]).toEqual(SOLVED[0])
      for (const m of [0, 2, 4, 6, 8]) {
        const edge = cubieAt(cube, GHOST_SLOTS[m]!)!
        expect(SOLVED.indexOf(cubieAt(SOLVED, GHOST_SLOTS[m]!)!)).toBe(cube.indexOf(edge))
      }
    }
  }, 20000)

  it('is entered piece by piece: each click puts the next piece that fits', () => {
    const top = GHOST_SLOTS[0]!.join(',')
    const corner = GHOST_SLOTS[1]!.join(',')
    let edit = emptyEdit('ghost')
    expect(placedCount(edit, 'ghost')).toEqual({ placed: 0, total: 10 })
    // An edge slot: its own edge, then the same flipped, then back.
    const shapes = [1, 2, 3].map(() => {
      edit = nextPiece(edit, 'ghost', top)
      return stateKey([piecesIn(edit, 'ghost').get(top)!])
    })
    expect(new Set(shapes).size).toBe(2)
    expect(shapes[2]).toBe(shapes[0])
    // A corner slot: five corners either way up, but not one placed elsewhere.
    const seen = (from: typeof edit) => {
      const keys = new Set<string>()
      for (let i = 0; i < 12; i++) {
        from = nextPiece(from, 'ghost', corner)
        keys.add(stateKey([piecesIn(from, 'ghost').get(corner)!]))
      }
      return keys.size
    }
    expect(seen(edit)).toBe(10)
    expect(seen(nextPiece(edit, 'ghost', GHOST_SLOTS[3]!.join(',')))).toBe(8)
  })

  it('rejects an entry no turns can reach: a single edge flipped', () => {
    let edit = cubeToEdit(SOLVED)
    edit = nextPiece(edit, 'ghost', GHOST_SLOTS[0]!.join(','))
    expect(isComplete(edit, 'ghost')).toBe(true)
    expect(validateCube(buildCube(edit, 'ghost'))).toEqual({ ok: false, error: 'impossible' })
  })
})
