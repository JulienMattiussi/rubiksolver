import { AXIS_ROTATIONS, normalIndex } from '@/lib/core/geometry'
import { solvedCube } from '@/lib/core/cube'
import { colorsOf } from '@/lib/core/pieces'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { type P3, type PiecePolygon } from '../../core/polygons'
import { dot, polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the Dino Cylinder's pieces (lib/puzzles/round/dinoCyl.ts): a cylinder as
 * high as it is wide (radius 1, height -1 to 1, the cube's half side 1, as
 * many flat sides as it takes to look round), cut by each corner's plane,
 * x + y + z = 1 and the like (through its three neighbors, as the Dino's).
 * A piece is the part on its side of those planes: a corner beyond its own
 * only, an edge beyond its two. Drawn in its solved place, then carried as
 * it stands (the turn from there, read on its stickers): turned out of
 * place, a piece sticks out of the cylinder. Its round side bears, facet by
 * facet, the color of its sticker facing most that way (its top and bottom
 * theirs).
 */

const SIDES = 48
const CUT = 1
const SCALE = 1.25
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.95

const DIAGONALS: readonly Vec3[] = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((y) => [-1, 1].map((z): Vec3 => [x, y, z])),
)

/** The cylinder: its round side (flat sides) and its two discs. */
const CYLINDER: readonly Plane[] = [
  ...Array.from({ length: SIDES }, (_, k): Plane => {
    const a = (2 * Math.PI * (k + 0.5)) / SIDES
    return { normal: [Math.cos(a), 0, Math.sin(a)] as unknown as Vec3, offset: 1 }
  }),
  { normal: [0, 1, 0], offset: 1 },
  { normal: [0, -1, 0], offset: 1 },
]

/** A piece's planes in its solved place: the cylinder, and each corner's
 *  plane, the piece beyond it (its corner, or one of its edge's two) or
 *  short of it. */
function planesOf(position: Vec3): Plane[] {
  const cuts = DIAGONALS.map((d): Plane => {
    const beyond = dot(d, position) >= 2
    return beyond
      ? { normal: d.map((v) => -v) as unknown as Vec3, offset: -CUT }
      : { normal: d, offset: CUT }
  })
  return [...CYLINDER, ...cuts]
}

const SOLVED = solvedCube('dinoCyl')
const HOMES = new Map(SOLVED.map((c) => [colorsOf(c), c]))

/** The whole-puzzle turn taking a piece from its solved place to where it
 *  stands (sticker by sticker: turns keep their order). */
function turnOf(cubie: Cubie, home: Cubie): (v: Vec3) => Vec3 {
  return AXIS_ROTATIONS.find(
    (turn) =>
      turn(home.position).join() === cubie.position.join() &&
      home.stickers.every((s, k) => turn(s.normal).join() === cubie.stickers[k]!.normal.join()),
  )!
}

const isOuter = (normal: Vec3, corners: readonly P3[]) =>
  CYLINDER.some(
    (p) =>
      Math.abs(dot(p.normal, normal) - Math.hypot(...normal)) < 1e-9 &&
      corners.every((c) => Math.abs(dot(p.normal, c) - p.offset) < 1e-9),
  )

const SHAPES = new Map<string, PiecePolygon[]>()

/** Facets of one color side by side as one polygon each: the edges they
 *  share dropped, the rest chained into outlines; its normal the mean of
 *  theirs. */
function mergeFacets(facets: readonly PiecePolygon[]): PiecePolygon[] {
  const id = (p: P3) => p.map((v) => v.toFixed(5)).join()
  const edges = new Map<string, [P3, P3]>()
  for (const { points } of facets) {
    points.forEach((a, k) => {
      const b = points[(k + 1) % points.length]!
      const back = `${id(b)}>${id(a)}`
      if (edges.has(back)) edges.delete(back)
      else edges.set(`${id(a)}>${id(b)}`, [a, b])
    })
  }
  const from = new Map([...edges.values()].map(([a, b]) => [id(a), b]))
  const sum = [0, 0, 0]
  for (const f of facets) f.normal.forEach((v, d) => (sum[d]! += v))
  const length = Math.hypot(...sum)
  const normal = sum.map((v) => v / length) as unknown as P3
  const out: PiecePolygon[] = []
  while (from.size) {
    const [start, next] = from.entries().next().value as [string, P3]
    const points: P3[] = []
    for (let at = start, to = next; ;) {
      from.delete(at)
      points.push(to)
      at = id(to)
      if (at === start || !from.has(at)) break
      to = from.get(at)!
    }
    out.push({ points, paint: facets[0]!.paint, normal })
  }
  return out
}

function polygonsOf(cubie: Cubie, outside: boolean): PiecePolygon[] {
  const id = cubie.stickers.map((s) => s.normal.join() + s.color).join('|') + (outside ? 'o' : '')
  const known = SHAPES.get(id)
  if (known) return known
  const home = HOMES.get(colorsOf(cubie))!
  const turn = turnOf(cubie, home)
  const faces = polyhedron(planesOf(home.position))
  const all = faces.flatMap((f) => f.corners)
  const middle = [0, 1, 2].map((d) => all.reduce((s, p) => s + p[d]!, 0) / all.length)
  const carry = (p: readonly number[]): P3 =>
    turn(
      p.map((v, d) => (middle[d]! + (v - middle[d]!) * SHRINK) * SCALE) as unknown as Vec3,
    ) as unknown as P3
  const out = faces.flatMap(({ corners, normal }): PiecePolygon[] => {
    const outer = isOuter(normal, corners)
    if (outside && !outer) return []
    const length = Math.hypot(...normal)
    const n = turn(normal).map((v) => v / length) as unknown as P3
    const points = corners.map(carry)
    const body: PiecePolygon = { points, paint: 'body', normal: n }
    if (!outer) return [body]
    // Its sticker facing most that way (in its solved place).
    const sticker = home.stickers.reduce((best, s) =>
      dot(s.normal, normal) > dot(best.normal, normal) ? s : best,
    )
    const round = normal[1] === 0
    // Each point's outward normal: the round side's own (radial), so two
    // facets side by side lift their shared edge alike, with no crack.
    const normals = corners.map((c) => {
      const r = Math.hypot(c[0], c[2])
      return round ? (turn([c[0] / r, 0, c[2] / r] as unknown as Vec3) as unknown as P3) : n
    })
    const lifted = points.map((p, i) => p.map((v, d) => v + normals[i]![d]! * 0.004) as P3)
    return [
      // The thumbnail its color alone: facet bodies would seam its round side.
      ...(outside ? [] : [body]),
      {
        points: lifted,
        paint: sticker.color,
        normal: n,
        ni: normalIndex(turn(sticker.normal)),
        // The round side lit as round.
        ...(round && { normals }),
      },
    ]
  })
  // The thumbnail draws each colored face as one polygon (its facets
  // merged), shaded as one: drawn apart, they would show in stripes.
  if (outside) {
    const merged = [...new Set(out.map((p) => p.paint))].flatMap((paint) =>
      mergeFacets(out.filter((p) => p.paint === paint)),
    )
    SHAPES.set(id, merged)
    return merged
  }
  SHAPES.set(id, out)
  return out
}

export const dinoCylPolygons = (cubie: Cubie) => polygonsOf(cubie, false)
export const dinoCylThumbnail = (cubie: Cubie) => polygonsOf(cubie, true)
