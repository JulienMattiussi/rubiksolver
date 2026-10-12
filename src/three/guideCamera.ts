import { FACE_SPEC } from '@/lib/geometry'
import { pyraRotation } from '@/lib/pyraminx'
import type { Turn } from '@/lib/types'
import { HOME_POSITION } from './camera'
import { PYRA_YAW } from './pyraGeometry'

/** Closer than the scene: a tile is small, the puzzle should fill it. */
const ZOOM = 0.78

/**
 * Where the move guide looks from to show a turn: the scene's home framing,
 * mirrored so the turning layer faces the camera (from below for D, from
 * behind for B). A star prism's lower layers are seen from below, a
 * Pyraminx corner from its own side, at the home view's height.
 */
export function guideCameraPosition(turn: Turn): [number, number, number] {
  const [x, y, z] = HOME_POSITION.clone().multiplyScalar(ZOOM).toArray()
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
  const { coordIndex, dir } = FACE_SPEC[turn.face]
  const position: [number, number, number] = [x, y, z]
  position[coordIndex] = Math.abs(position[coordIndex]) * dir
  return position
}
