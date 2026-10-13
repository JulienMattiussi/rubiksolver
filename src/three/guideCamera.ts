import { FACE_NORMAL, FACE_SPEC } from '@/lib/geometry'
import { pyraRotation } from '@/lib/pyraminx'
import { RAINBOW_CORNERS } from '@/lib/rainbow'
import type { Turn } from '@/lib/types'
import { HOME_POSITION } from './camera'
import { inScene, type PolyDrawing } from './polyDrawing'
import { PYRA_YAW } from './pyraGeometry'

/** Closer than the scene: a tile is small, the puzzle should fill it. */
const ZOOM = 0.78

/**
 * Where the move guide looks from to show a turn: the scene's home framing,
 * mirrored so the turning layer faces the camera (from below for D, from
 * behind for B). A star prism's lower layers are seen from below, a
 * Pyraminx corner from its own side, at the home view's height; on a
 * puzzle drawn in its own frame, from where its turning face looks (a
 * Rainbow's triangle too); the Floppy Ghost from the front, where its sides
 * flip over.
 */
export function guideCameraPosition(turn: Turn, drawing?: PolyDrawing): [number, number, number] {
  const [x, y, z] = HOME_POSITION.clone().multiplyScalar(ZOOM).toArray()
  const turned = drawing?.orient && 'face' in turn ? FACE_NORMAL[turn.face] : undefined
  const facing = 'triangle' in turn ? RAINBOW_CORNERS[turn.triangle] : turned
  if (drawing && facing) {
    // A face of a puzzle drawn in its own frame (the Pyramorphinx), a
    // Rainbow's triangle: the home framing pulled toward where it looks.
    const toward = inScene(drawing, facing)
    const distance = Math.hypot(x, y, z)
    const mix = [x, y, z].map((v, d) => v / distance + 1.2 * toward[d]!)
    const length = Math.hypot(...mix)
    return mix.map((v) => (v / length) * distance) as [number, number, number]
  }
  // A Floppy Ghost side flips over in front of the home framing.
  if ('side' in turn || 'triangle' in turn || 'layer' in turn || 'flip' in turn) return [x, y, z]
  if ('slash' in turn) return [x, y, z]
  if ('ring' in turn) return turn.ring === 'D' || turn.ring === 'd' ? [x, -y, z] : [x, y, z]
  if ('vertex' in turn) {
    // The home framing swung round to the corner's side (the top one is in it).
    if (turn.vertex === 'U') return [x, y, z]
    const { axis } = pyraRotation(turn)
    const bearing = Math.atan2(axis[0], axis[2]) + PYRA_YAW
    const across = Math.hypot(x, z)
    return [Math.sin(bearing) * across, y, Math.cos(bearing) * across]
  }
  const { coordIndex, dir } = FACE_SPEC['gear' in turn ? turn.gear : turn.face]
  const position: [number, number, number] = [x, y, z]
  position[coordIndex] = Math.abs(position[coordIndex]) * dir
  return position
}
