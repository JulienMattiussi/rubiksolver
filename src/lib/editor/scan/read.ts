import { tablesFor } from '../editorTables'
import type { CubeShape } from '../../core/shapes'
import { readFaces, type ScanReading } from './classify'
import { cubeToEdit } from '../edit'
import { readGears } from './gears'
import { readHalves } from './halves'
import { readForms } from './forms'
import { readOutlines, type Picture } from './outlines'
import { scanPlan } from './plan'
import type { CellSample } from './sample'

type Taken = readonly (readonly CellSample[])[]

/** A scanned puzzle read from each face's cells (`scanPlan`'s order): its
 *  colors (classify.ts), and its form if it changes shape (forms.ts); or
 *  from its pictures, a puzzle read whole (outlines.ts); or the face to
 *  take again. `behind`: filmed by a camera facing the user, the faces as
 *  its mirrored gestures bring them (`orderFor`). */
export function readScan(
  shape: CubeShape,
  taken: Taken,
  behind = false,
  pictures: readonly (Picture | undefined)[] = [],
): ScanReading {
  const plan = scanPlan(shape, 'classic', behind)
  const whole = plan[0]?.whole
  if (whole) {
    const read = pictures[0] && readOutlines(whole, pictures[0])
    return read?.ok ? { ok: true, edit: cubeToEdit(read.cube) } : { ok: false, face: 0 }
  }
  if (plan[0]?.halves) return readHalves(shape, taken, behind)
  if (plan[0]?.gears) return readGears(shape, taken, behind)
  return plan[0]?.open
    ? readForms(shape, taken, behind)
    : readFaces({ shape, plan, tables: tablesFor(shape) }, taken).reading
}
