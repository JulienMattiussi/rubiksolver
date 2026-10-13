import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/cube'
import { applyGearMove } from '@/lib/gear'
import type { Cube, Face, GearMove } from '@/lib/types'

const SOLVED = solvedCube('gearU')

/** fan2cube's letters in the cube's (D = R, A = F, G = L...): each a half
 *  turn, so its D² is our R. */
const play = (moves: string): Cube =>
  moves
    .split(' ')
    .map((t): GearMove => ({ gear: t[0] as Face, amount: t.includes("'") ? 3 : 1 }))
    .reduce(applyGearMove, SOLVED)

/** What a sequence changed, piece by piece: moved, turned over, spun. */
function changes(cube: Cube) {
  return SOLVED.flatMap((c, i) => {
    const a = cube[i]!
    const moved = a.position.join() !== c.position.join()
    const turned = a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
    return moved || turned || a.spin !== c.spin
      ? [{ at: c.position.join(), to: a.position.join(), turned, spin: a.spin }]
      : []
  })
}

describe('Gear Cube model', () => {
  it('turns a face half and the slice beside it a quarter, its gears a sixth', () => {
    const after = play('R')
    const slice = changes(after).filter((c) => c.at.startsWith('0,'))
    // The slice's centers and edges all moved a quarter; its 4 gears spun.
    expect(slice).toHaveLength(8)
    expect(slice.filter((c) => c.spin === 1)).toHaveLength(4)
    // The left face held.
    expect(changes(after).some((c) => c.at.startsWith('-1,'))).toBe(false)
  })

  it('pivots the 4 gears of a slice with D⁸, nothing else (fan2cube)', () => {
    const c = changes(play('R R R R'))
    expect(c.map((p) => p.at).sort()).toEqual(['0,-1,-1', '0,-1,1', '0,1,-1', '0,1,1'])
    expect(c.every((p) => p.to === p.at && !p.turned && p.spin === 4)).toBe(true)
  })

  it('turns over the 8 edges of the top and bottom with (A² D²)³ (fan2cube)', () => {
    const c = changes(play('F R F R F R'))
    expect(c).toHaveLength(8)
    expect(c.every((p) => p.to === p.at && p.turned && p.spin === 3)).toBe(true)
    expect(c.every((p) => p.at.split(',')[1] !== '0')).toBe(true)
  })

  it('turns the whole cube over with G’² D², no piece out of place (fan2cube)', () => {
    const after = play("L' R")
    // A half turn about the left-right axis: every piece where its mirror was.
    expect(
      SOLVED.every((c, i) => {
        const [x, y, z] = c.position
        return after[i]!.position.join() === [x, -y, -z].join() && (after[i]!.spin ?? 0) === 0
      }),
    ).toBe(true)
  })

  it('comes back after twelve turns of a face (two full turns of its gears)', () => {
    const twelve = Array.from({ length: 12 }, () => 'R').join(' ')
    expect(changes(play(twelve))).toEqual([])
  })
})
