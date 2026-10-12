import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey, turnDims } from '@/lib/cube'
import { faceOfNormal, normalIndex } from '@/lib/geometry'
import { GHOST_TURNS, ghostSlot } from '@/lib/ghost'
import { applyMove } from '@/lib/turn'
import type { Cubie } from '@/lib/types'
import { ghostPolygons, ghostSquareSides } from '@/three/ghostGeometry'

const SOLVED = solvedCube('ghost')

/** Every way each piece stands, from turning it alone. */
function poses(): Cubie[] {
  const seen = new Map(SOLVED.map((c) => [stateKey([c]), c]))
  const queue = [...SOLVED]
  for (let i = 0; i < queue.length; i++) {
    for (const turn of GHOST_TURNS) {
      const [next] = applyMove([queue[i]!], turn, turnDims('ghost'))
      if (seen.has(stateKey([next!]))) continue
      seen.set(stateKey([next!]), next!)
      queue.push(next!)
    }
  }
  return [...seen.values()]
}

/** A piece's outline as drawn, whatever its stickers. */
const outline = (cubie: Cubie) =>
  ghostPolygons(cubie)
    .filter((p) => p.paint === 'body')
    .map((p) =>
      p.points
        .map((q) => q.map((v) => v.toFixed(3)).join())
        .sort()
        .join(' '),
    )
    .sort()
    .join('|')

describe('Floppy Ghost geometry', () => {
  it('gives each piece the square sides its stickers say', () => {
    for (const cubie of SOLVED.slice(1)) {
      const sides = cubie.stickers
        .filter((s) => s.normal[2] === 0)
        .map((s) => faceOfNormal(s.normal))
      expect(ghostSquareSides(ghostSlot(cubie.position)!).sort()).toEqual(sides.sort())
    }
  })

  it('draws every sticker of a piece, however it stands', () => {
    for (const cubie of poses()) {
      const drawn = ghostPolygons(cubie).flatMap((p) => (p.paint === 'body' ? [] : [p.ni]))
      expect(drawn.sort()).toEqual(cubie.stickers.map((s) => normalIndex(s.normal)).sort())
    }
  })

  it('shows every pose of a slot in its own shape: silver is enough', () => {
    const bySlot = new Map<string, Set<string>>()
    const all = poses()
    for (const cubie of all) {
      const shapes = bySlot.get(cubie.position.join()) ?? new Set()
      shapes.add(outline(cubie))
      bySlot.set(cubie.position.join(), shapes)
    }
    // 10 poses in a corner slot (5 corners, either way up), 2 in an edge's.
    expect([...bySlot.values()].map((s) => s.size).sort((a, b) => a - b)).toEqual([
      1, 2, 2, 2, 2, 2, 10, 10, 10, 10, 10,
    ])
  })
})
