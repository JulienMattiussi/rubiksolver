import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { normalIndex } from '@/lib/core/geometry'
import { cubeToEdit, emptyEdit } from '@/lib/editor/edit'
import { stickerId, tablesFor } from '@/lib/editor/editorTables'
import { entryOf, type EditStickers } from '@/lib/editor/entry'
import { tileColors } from '@/lib/editor/modes/pairs'
import type { Color, Vec3 } from '@/lib/core/types'

const SHAPE = 'impossible'
const together = entryOf(SHAPE).paint.together!

/** A tile clicked with a color, as the editor paints a Rubik's Impossible. */
const click = (edit: EditStickers, at: Vec3, normal: Vec3, color: Color) =>
  together((e) => e, edit, at.join(), normalIndex(normal), color, {})

/** Several clicks, in order. */
const clicks = (edit: EditStickers, at: Vec3, paints: [Vec3, Color][]) =>
  paints.reduce((e, [normal, color]) => click(e, at, normal, color), edit)

const own = (edit: EditStickers, at: Vec3, normal: Vec3) => edit[stickerId(at, normalIndex(normal))]

const X: Vec3 = [1, 0, 0]
const Y: Vec3 = [0, 1, 0]
const Z: Vec3 = [0, 0, 1]
const minus = (v: Vec3): Vec3 => [-v[0], -v[1], -v[2]]

describe('entry by pairs (the Rubik’s Impossible)', () => {
  it('tells a piece by the two colors its tiles show, in any order', () => {
    // The white-blue-red corner, home, as its guide's grid says: white
    // and yellow on top, blue alone behind (an anchor), red and orange.
    const at: Vec3 = [1, 1, -1]
    const edit = clicks(emptyEdit(SHAPE), at, [
      [Y, 'Y'],
      [Y, 'W'],
      [minus(Z), 'B'],
      [X, 'O'],
      [X, 'R'],
    ])
    expect(own(edit, at, Y)).toBe('W')
    expect(own(edit, at, minus(Z))).toBe('B')
    expect(own(edit, at, X)).toBe('R')
    const slot = tablesFor(SHAPE).byKey.get(at.join())!
    expect(tileColors(SHAPE, edit, slot, normalIndex(X))).toEqual(['R', 'O'])
  })

  it('tells pieces showing the same colors without asking', () => {
    // The blue-orange edge shows blue and orange on both its tiles: either
    // way round stands for it (its model settles it once built).
    const at: Vec3 = [-1, 0, -1]
    const edit = clicks(emptyEdit(SHAPE), at, [
      [minus(Z), 'O'],
      [minus(Z), 'B'],
      [minus(X), 'B'],
      [minus(X), 'O'],
    ])
    expect([own(edit, at, minus(Z)), own(edit, at, minus(X))].sort()).toEqual(['B', 'O'])
  })

  it('goes on from a state entered as it stands', () => {
    const edit = cubeToEdit(solvedCube(SHAPE))
    const at: Vec3 = [1, 1, -1]
    // Its own color again: nothing changes.
    const again = click(edit, at, Y, 'W')
    expect(own(again, at, Y)).toBe('W')
    expect(own(again, at, X)).toBe('R')
    // Another color: the piece is told again from this tile.
    const other = click(edit, at, Y, 'G')
    expect(own(other, at, Y)).toBeUndefined()
  })
})
