import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/notation'
import { LAYER_THICKNESS } from '@/lib/core/shape'
import { applyMoves } from '@/lib/core/turn'
import { cubiesHull, faceCenter } from '@/three/core/hull'

const CLASSIC = LAYER_THICKNESS.classic
const MIRROR = LAYER_THICKNESS.mirror
const at = (p: string) => (cube: ReturnType<typeof solvedCube>) =>
  cube.find((c) => c.position.join() === p)!

describe('the tutorial arrow’s ends and outline', () => {
  it('on a plain cube: half a cell out of the piece’s cell, the box a cube', () => {
    const cube = solvedCube('3')
    expect(faceCenter(at('1,1,1')(cube), [0, 1, 0], [3, 3, 3], CLASSIC)).toEqual([1, 1.5, 1])
    expect(cubiesHull(cube, [3, 3, 3], CLASSIC).map((h) => h.offset)).toEqual([
      1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
    ])
  })

  it('on a mirror cube: on the sticker as drawn, its thickness and its place', () => {
    const cube = solvedCube('3')
    // The top is white, 24 mm thick (in 18 mm middle layers): its face that
    // far above its inner side.
    const [x, y, z] = faceCenter(at('0,1,0')(cube), [0, 1, 0], [3, 3, 3], MIRROR)
    expect([x, z]).toEqual([0, 0])
    expect(y).toBeCloseTo(0.5 + 24 / 18, 6)
  })

  it('on a scrambled mirror cube: the outline reaches its bumps', () => {
    const scrambled = applyMoves(solvedCube('3'), parseMoves("R U F' L2 D B'"))
    const hull = cubiesHull(scrambled, [3, 3, 3], MIRROR)
    // A thick layer turned onto a thin side sticks out past the plain box.
    expect(Math.max(...hull.map((h) => h.offset))).toBeGreaterThan(1.5 + 0.2)
  })
})
