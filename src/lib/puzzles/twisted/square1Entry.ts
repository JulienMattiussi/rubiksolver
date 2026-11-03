import { FACE_COLOR, solvedCube } from '../../core/cube'
import { SECTOR_NORMALS } from '../../core/geometry'
import type { Color, Cube, Cubie, Sticker } from '../../core/types'
import type { FormPick, FormStages } from '../../editor/entry'
import { once } from '../../solve/once'
import { applySectorMove, sectorAt, sectorPlace } from '../shared/sectors'
import { SQUARE1_SYMMETRIES } from './square1'
import { isFlipped, keyOf, outline, slashWays, turned } from './square1Shape'

/**
 * The Square-1 entered in the shape it stands in, chosen in three stages
 * (modes/form.ts offers a puzzle's forms as thumbnails, far too many here:
 * 340): its top's outline, then its bottom's among those that go with it,
 * each turned as it stands against the slash's cut, then its middle, square
 * or not. Its pieces are then put one by one (modes/pieces.ts).
 *
 * A layer is picked by its outline's key, then its way round
 * (square1Shape.ts): a top's twelfths clockwise seen from above, a
 * bottom's seen from below, as its turns count them.
 */

const STAGES = ['top', 'bottom', 'middle'] as const

/** How many different ways round an outline stands. */
const waysOf = (key: string): number =>
  Array.from({ length: 12 }, (_, r) => turned(key, r)).filter((c, r, all) => all.indexOf(c) === r)
    .length

/** Its shapes, each its top's and bottom's keys and its middle flipped or
 *  not: every one its turns reach from the box (all 340). */
const SHAPES = once(() => {
  const keyOfShape = (cube: Cube) =>
    `${keyOf(outline(cube, 1)).key}|${keyOf(outline(cube, -1)).key}|${isFlipped(cube)}`
  const solved = solvedCube('square1')
  const seen = new Set([keyOfShape(solved)])
  let frontier = [solved]
  while (frontier.length) {
    const next: Cube[] = []
    for (const state of frontier) {
      for (const { at } of slashWays(state)) {
        const cube = applySectorMove(at, { flip: true })
        const key = keyOfShape(cube)
        if (seen.has(key)) continue
        seen.add(key)
        next.push(cube)
      }
    }
    frontier = next
  }
  return [...seen].map((key) => {
    const [top, bottom, flipped] = key.split('|')
    return { top: top!, bottom: bottom!, flipped: flipped === 'true' }
  })
})

const distinct = (keys: readonly string[]) => [...new Set(keys)].sort()

/** The middle's two ways: square, or its right half flipped. */
const MIDDLES = ['square', 'flipped'] as const

/** The pieces' colors to put in a form (whichever, entering puts its own):
 *  its caps, then its sides. */
const side = (m: number, color: Color): Sticker => ({ normal: SECTOR_NORMALS[m]!, color })
/** A layer's cap color (read when called: the core loads after). */
const capColor = (z: number): Color => FACE_COLOR[z > 0 ? 'U' : 'D']

/** The pieces of a layer of this outline. */
function layer(cells: string, z: number): Cubie[] {
  const out: Cubie[] = []
  for (let m = 0; m < 12; m++) {
    const cap: Sticker = { normal: [0, 0, z], color: capColor(z) }
    if (cells[m] === 'e') {
      out.push({ position: sectorAt(m, z), stickers: [cap, side(m, FACE_COLOR.F)] })
    } else if (cells[m] === 'b') {
      out.push({
        position: sectorAt(m, z, true),
        stickers: [cap, side((m + 10) % 12, FACE_COLOR.F), side((m + 1) % 12, FACE_COLOR.R)],
      })
    }
  }
  return out
}

/** The middle's halves in their own colors, the right one flipped or not:
 *  the left one never moves, so entering keeps it as the form has it. */
function middle(flipped: boolean): Cubie[] {
  // Flipped, its right, back and front sides face sectors 3, 6 and 0.
  const [right, back, front] = flipped ? [3, 6, 0] : [2, 11, 5]
  return [
    {
      position: [1, 0, 0],
      stickers: [side(right, FACE_COLOR.R), side(back, FACE_COLOR.B), side(front, FACE_COLOR.F)],
    },
    {
      position: [-1, 0, 0],
      stickers: [side(8, FACE_COLOR.L), side(11, FACE_COLOR.B), side(5, FACE_COLOR.F)],
    },
  ]
}

/** A form from its picks (a stage not picked yet: its first choice). */
function formOf(picks: readonly FormPick[]): Cube {
  // Each stage not picked takes its first choice, given those before.
  const filled: FormPick[] = []
  STAGES.forEach((_, i) => filled.push(picks[i] ?? choices(i, filled)[0]!))
  const [top, bottom, mid] = filled
  return [
    ...layer(turned(top!.key, top!.way), 1),
    ...layer(turned(bottom!.key, -bottom!.way), -1),
    ...middle(mid!.key === 'flipped'),
  ]
}

/** A stage's choices, the earlier ones picked, each its first way round. */
function choices(stage: number, picks: readonly FormPick[]): FormPick[] {
  const shapes = SHAPES().filter(
    (s) => (stage < 1 || s.top === picks[0]?.key) && (stage < 2 || s.bottom === picks[1]?.key),
  )
  if (stage === 0) return distinct(shapes.map((s) => s.top)).map((key) => ({ key, way: 0 }))
  if (stage === 1) return distinct(shapes.map((s) => s.bottom)).map((key) => ({ key, way: 0 }))
  return MIDDLES.filter((m) => shapes.some((s) => s.flipped === (m === 'flipped'))).map((key) => ({
    key,
    way: 0,
  }))
}

export const SQUARE1_FORM_STAGES: FormStages = {
  stages: STAGES,
  cut: true,
  options: (stage, picks) =>
    choices(stage, picks).map(({ key }) => ({ key, ways: stage < 2 ? waysOf(key) : 1 })),
  form: formOf,
  // Seen from above: a layer's pieces, the bottom's turned over to show its
  // face (about the slash's line), the middle's halves.
  picture: (stage, picks) => {
    const form = formOf(picks)
    const z = stage === 0 ? 1 : stage === 1 ? -1 : 0
    return form
      .filter((c) => (sectorPlace(c.position)?.z ?? 0) === z)
      .map((c) => (z < 0 ? SQUARE1_SYMMETRIES[0]!([c])[0]! : c))
  },
  of: (cube) => {
    const top = keyOf(outline(cube, 1))
    const bottom = keyOf(outline(cube, -1))
    // A bottom's way counts its turns, the other way round.
    return [
      top,
      { key: bottom.key, way: (12 - bottom.way) % 12 },
      {
        key: isFlipped(cube) ? 'flipped' : 'square',
        way: 0,
      },
    ]
  },
}
