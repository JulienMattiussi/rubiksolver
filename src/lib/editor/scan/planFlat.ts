import { cubeOrientations, solvedCube } from '../../core/cube'
import { cross, dot, normalIndex } from '../../core/geometry'
import type { CubeShape } from '../../core/shapes'
import type { Vec3 } from '../../core/types'
import { stickerId } from '../editorTables'
import { fitScale, gap, polygonFrame, type Point } from './layout'
import type { FlatFace } from './plan'

/** How far out toward each side a flat face's outermost pieces sit. */
const FLAT_SHARE = 0.8

const unit = (v: readonly number[]): Vec3 => {
  const length = Math.hypot(...v)
  return [v[0]! / length, v[1]! / length, v[2]! / length]
}

/** A polyhedron's flat faces, in order (its model's, `PuzzleModel.scan:
 *  { flat }`): each its stickers (those it says it shows, `shown`), at
 *  their pieces' places across it, in a
 *  frame of its shape (a regular polygon, as many sides as the ways the
 *  puzzle shows it turned), which the view replaces by where its drawing
 *  shows them. The ways it can be held turned are the puzzle's own
 *  orientations keeping the face where it is, read cell by cell. */
export function flatFaces(shape: CubeShape, faces: readonly FlatFace[]) {
  const solved = solvedCube(shape)
  const orientations = cubeOrientations(solved)
  const same = (a: readonly number[], b: readonly number[]) => a.join() === b.join()
  return faces.map((face) => {
    const n = unit(face.normal)
    const across = dot(face.up, n)
    const up = unit(face.up.map((x, a) => x - across * n[a]!))
    const right = cross(up, n)
    const shown =
      face.shown ??
      ((position: Vec3, normal: Vec3) => (same(normal, face.normal) ? position : null))
    const on = solved.flatMap((c, i) =>
      c.stickers.flatMap((s) => {
        const at = shown(c.position, s.normal)
        if (!at) return []
        const id = stickerId(c.position, normalIndex(s.normal))
        return [{ i, color: s.color, id, at: [dot(at, right), dot(at, up)] as Point }]
      }),
    )
    const index = new Map(on.map((s, k) => [s.id, k]))
    // Each orientation keeping the face: where it takes each cell's sticker.
    const turns = new Map<string, number[]>()
    for (const turned of orientations) {
      const turn = on.map(({ i, color }) => {
        const c = turned[i]!
        const s = c.stickers.find((t) => t.color === color)!
        return index.get(stickerId(c.position, normalIndex(s.normal))) ?? -1
      })
      if (!turn.includes(-1)) turns.set(turn.join(), turn)
    }
    const frame = polygonFrame(face.sides ?? turns.size, face.pointDown)
    const scale = fitScale(
      on.map((s) => s.at),
      frame.outline,
      frame.middle,
      FLAT_SHARE,
    )
    const [mx, my] = frame.middle
    const points = on.map(({ at: [x, y] }): Point => [mx + scale * x, my - scale * y])
    const closest = Math.min(...points.flatMap((p, k) => points.slice(k + 1).map((q) => gap(p, q))))
    const middle = points.findIndex((p) => gap(p, frame.middle) < 1e-6)
    return {
      width: frame.width,
      height: frame.height,
      points,
      reach: 0.3 * closest,
      outline: frame.outline,
      lines: [],
      // The identity first (the first orientation is the puzzle as it is).
      turns: [...turns.values()],
      move: face.move,
      angle: face.angle ?? null,
      frontColor: face.frontColor,
      upColor: face.upColor,
      cells: on.map((s) => s.id),
      center: middle < 0 ? null : middle,
      seen: { normal: face.normal, up: face.up, middle: frame.middle },
    }
  })
}
