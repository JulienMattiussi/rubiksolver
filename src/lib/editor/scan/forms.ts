import { tablesFor } from '../editorTables'
import type { CubeShape } from '../../core/shapes'
import { coreOf, facesShown, holdings, type Shown } from './box'
import { readFaces, type ScanReading } from './classify'
import { colored } from './color'
import { gridLayout } from './layout'
import { scanPlan, type ScanFace } from './plan'
import type { CellSample } from './sample'

/**
 * The form a puzzle that changes shape stands in, found from its scan
 * (pure): its faces were taken as the box it turns in, its core in the
 * frame's marked cells (box.ts), so each cell stands where its mechanism
 * says; each shows a sticker, a piece's black side or nothing (the
 * background). The core's cells show pieces only: what they look like,
 * under this light, tells round them a piece from the background (a grey
 * wall, a hand, a shadow), whatever the camera makes of the colors. Each of
 * its forms, held each way its long side stays upright, says what each cell
 * shows; the forms whose faces agree best with the pictures (a sticker
 * where a cell looks like the core's stickers, a black side where it is
 * dark; the background, anything) are read whole (classify.ts), and the
 * cheapest reading wins.
 */

/** What a picture's cell looks like: a sticker, dark (a black side, or a
 *  dark background), or anything else. */
type Look = 'color' | 'dark' | 'other'

const DARK_LIGHTNESS = 30
/** How near a sticker of the core a cell must look to be a sticker, its
 *  lightness counted whole: a grey wall is a white sticker, darker. */
const NEAR = 12

/** What each face's cells look like, against the core's (its stickers and
 *  black sides as this light shows them). */
function looksOf(shape: CubeShape, taken: readonly (readonly CellSample[])[]): Look[][] {
  const core = coreOf(shape)
  const dark = (cell: CellSample) => cell.lab[0] < DARK_LIGHTNESS && !colored(cell.lab)
  const stickers = taken.flatMap((cells, f) =>
    (core[f] ?? []).flatMap((i) => (cells[i] && !dark(cells[i]) ? [cells[i].lab] : [])),
  )
  return taken.map((cells) =>
    cells.map((cell): Look => {
      if (dark(cell)) return 'dark'
      return stickers.some((lab) => Math.hypot(...lab.map((x, k) => x - cell.lab[k]!)) <= NEAR)
        ? 'color'
        : 'other'
    }),
  )
}

/** What a cell costs, its form's guess against what it looks like. */
const DISAGREE: Record<'sticker' | 'black' | 'empty', Record<Look, number>> = {
  sticker: { color: 0, other: 1, dark: 3 },
  black: { color: 3, other: 1, dark: 0 },
  // The background may be anything; seldom a sticker's look.
  empty: { color: 1, other: 0, dark: 0 },
}

/** How many forms, best first, are read whole. */
const READ = 6
/** A disagreeing cell, against the cost of a reading (a sticker's
 *  distance to its color). */
const CELL_COST = 30

/** How much a face as a form shows it disagrees with what its picture
 *  looks like. */
function cost(shown: readonly Shown[], looks: readonly Look[]): number {
  return shown.reduce((sum, s, i) => {
    const look = looks[i] ?? 'other'
    return sum + DISAGREE[s === null ? 'empty' : s === 'black' ? 'black' : 'sticker'][look]
  }, 0)
}

/** A puzzle that changes shape read from its scan: the colors and the form
 *  of the best reading of the forms that agree best with the pictures,
 *  else the face to take again. */
export function readForms(
  shape: CubeShape,
  taken: readonly (readonly CellSample[])[],
): ScanReading {
  const box = scanPlan(shape)
  const looks = looksOf(shape, taken)
  const candidates = holdings(shape).map((cube) => {
    const shown = facesShown(shape, cube)
    return { cube, shown, cost: shown.reduce((sum, s, f) => sum + cost(s, looks[f] ?? []), 0) }
  })
  candidates.sort((a, b) => a.cost - b.cost)

  // The cheapest good reading; none good, the best form's (its face to
  // take again).
  let best: { reading: ScanReading; total: number } | undefined
  for (const { cube, shown, cost: disagree } of candidates.slice(0, READ)) {
    const { reading, cost: read } = readFaces(
      { shape, plan: platesOf(box, shown), tables: tablesFor(shape, cube), form: cube },
      shown.map((s, f) => s.flatMap((x, i) => (x && x !== 'black' ? [taken[f]![i]!] : []))),
    )
    const total = disagree * CELL_COST + read

    if (!best || (reading.ok && (!best.reading.ok || total < best.total))) {
      best = { reading, total }
    }
  }
  return best?.reading ?? { ok: false, face: 0 }
}

/** The faces as a form shows them: each its stickers only, where it shows
 *  them, read as held (no turn). */
function platesOf(box: readonly ScanFace[], shown: readonly (readonly Shown[])[]): ScanFace[] {
  return shown.map((cells, f) => {
    const keep = cells.flatMap((s, i) => (s && s !== 'black' ? [i] : []))
    const grid = gridLayout(box[f]!.height, box[f]!.width)
    return {
      ...box[f]!,
      points: keep.map((i) => grid.points[i]!),
      cells: keep.map((i) => cells[i] as string),
      turns: [keep.map((_, j) => j)],
      open: undefined,
    }
  })
}
