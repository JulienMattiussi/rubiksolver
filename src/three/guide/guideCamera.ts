import { FACE_NORMAL, FACE_SPEC } from '@/lib/core/geometry'
import type { GuideSight } from '@/lib/core/guide'
import { isFaceTurn, kindOf } from '@/lib/core/moveKind'
import type { Turn } from '@/lib/core/types'
import { HOME_POSITION } from '../core/camera'
import { inScene, type PolyDrawing } from '../core/polyDrawing'

/** Closer than the scene: a tile is small, the puzzle should fill it. */
const ZOOM = 0.78

/**
 * Where the move guide looks from to show a turn, as its kind says
 * (`MoveKind.sight`, core/guide.ts): the scene's home framing, mirrored so
 * the turning layer faces the camera (from below for D, from behind for
 * B); on a puzzle drawn in its own frame, from where its turning part
 * looks (a Rainbow's triangle, a Megaminx face); a Curvy Copter edge from
 * beside it; a Pyraminx corner from its own side, at the home height.
 */
export function guideCameraPosition(turn: Turn, drawing?: PolyDrawing): [number, number, number] {
  const [x, y, z] = HOME_POSITION.clone().multiplyScalar(ZOOM).toArray()
  const sight: GuideSight = isFaceTurn(turn)
    ? // A face of a puzzle drawn in its own frame (the Pyramorphinx): where it looks.
      drawing?.orient
      ? { kind: 'toward', direction: FACE_NORMAL[turn.face] }
      : { kind: 'face', face: turn.face }
    : kindOf(turn)!.sight(turn)
  switch (sight.kind) {
    case 'toward': {
      if (!drawing) return [x, y, z]
      // The home framing pulled toward where it looks.
      const toward = inScene(drawing, sight.direction)
      const distance = Math.hypot(x, y, z)
      const mix = [x, y, z].map((v, d) => v / distance + 1.2 * toward[d]!)
      const length = Math.hypot(...mix)
      return mix.map((v) => (v / length) * distance) as [number, number, number]
    }
    case 'beside': {
      // Seen from the axis's side, a little above it.
      const [a, b, c] = sight.axis as [number, number, number]
      const length = Math.hypot(x, y, z) / Math.hypot(a, b + 0.4, c)
      return [a * length, (b + 0.4) * length, c * length]
    }
    case 'around': {
      // The home framing swung round to the axis's side, as drawn.
      const bearing = Math.atan2(sight.axis[0]!, sight.axis[2]!) + (drawing?.yaw ?? 0)
      const across = Math.hypot(x, z)
      return [Math.sin(bearing) * across, y, Math.cos(bearing) * across]
    }
    case 'face': {
      const { coordIndex, dir } = FACE_SPEC[sight.face]
      const position: [number, number, number] = [x, y, z]
      position[coordIndex] = Math.abs(position[coordIndex]) * dir
      return position
    }
    case 'home':
      return [x, y, z]
  }
}
