import { cubeShape } from '@/lib/core/cube'
import { stepOf } from '@/lib/editor/entry'
import { useCube } from '@/store/cubeStore'
import { FormThumbnails } from './FormThumbnails'
import { StagedFormPicker } from './StagedFormPicker'

/**
 * First step of entering a shape-shifting puzzle (the tower): the forms it
 * can stand in (modes/form.ts), as thumbnails grouped by how many small cubes
 * stick out alone (when that tells them apart). Hovering (or focusing) one shows it in 3D; picking one
 * goes on to its colors. Too many forms (a Square-1's): chosen in stages.
 */
export function FormPicker() {
  const shape = useCube((s) => cubeShape(s.cube))
  const stages = stepOf(shape, 'form')?.stages
  return stages ? <StagedFormPicker stages={stages} /> : <FormThumbnails />
}
