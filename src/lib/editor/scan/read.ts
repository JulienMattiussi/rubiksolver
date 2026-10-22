import { tablesFor } from '../editorTables'
import type { CubeShape } from '../../core/shapes'
import { readFaces, type ScanReading } from './classify'
import { cubeToEdit } from '../edit'
import { readForms } from './forms'
import { readOutlines, type Picture } from './outlines'
import { ORDER, scanPlan, type ScanFace } from './plan'
import type { CellSample } from './sample'

type Taken = readonly (readonly CellSample[])[]

/** A scanned puzzle read from each face's cells (`scanPlan`'s order): its
 *  colors (classify.ts), and its form if it changes shape (forms.ts); or
 *  from its pictures, a puzzle read whole (outlines.ts); or the face to
 *  take again. `behind`: filmed by a camera facing the user (`fromBehind`;
 *  a puzzle read whole is read either way). */
export function readScan(
  shape: CubeShape,
  taken: Taken,
  behind = false,
  pictures: readonly (Picture | undefined)[] = [],
): ScanReading {
  const plan = scanPlan(shape)
  const whole = plan[0]?.whole
  if (whole) {
    const read = pictures[0] && readOutlines(whole, pictures[0])
    return read?.ok ? { ok: true, edit: cubeToEdit(read.cube) } : { ok: false, face: 0 }
  }
  const seen = behind ? fromBehind(plan, taken) : undefined
  const faces = seen ?? taken
  const reading = plan[0]?.open
    ? readForms(shape, faces)
    : readFaces({ shape, plan, tables: tablesFor(shape) }, faces).reading
  return reading.ok || !seen ? reading : { ...reading, face: BEHIND[reading.face]! }
}

/** Which face of the plan each face taken from behind is (its own
 *  inverse), and whether it was upside down. */
const BEHIND = [0, 3, 2, 1, 4, 5]
const UPSIDE_DOWN = [false, false, false, false, true, true]

/** A camera facing the user (a laptop's) films the puzzle from behind: a
 *  puzzle shown by gestures (no face `told`), turned to the right as the
 *  user sees it, shows its sides the other way round (the left one after
 *  the front), then its top and bottom upside down. The faces taken, in
 *  the plan's order (none to change on a puzzle told by its colors, or not
 *  scanned in `ORDER`). */
function fromBehind(plan: readonly ScanFace[], taken: Taken): Taken | undefined {
  if (plan.length !== ORDER.length || plan.some((face) => face.told)) return undefined
  return plan.map((face, i) => {
    const shown = taken[BEHIND[i]!] ?? []
    if (!UPSIDE_DOWN[i]) return shown
    const half = face.turns[face.turns.length / 2]!
    return half.map((k) => shown[k]!)
  })
}
