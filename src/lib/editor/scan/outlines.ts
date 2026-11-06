import type { Cube, Cubie } from '../../core/types'
import type { P2 } from '../../core/plane'
import { findAnchor, type AnchorSeen } from './outlineAnchor'
import { apply, compose, fitAffine, scaleOf, type PlaneMap } from './outlineFit'
import { contrastOf, matchPose, probesOf, type Match } from './outlineMatch'
import { fitSeams, type SeamPoint } from './outlineSeams'

/**
 * A puzzle read from one picture by the outlines of its pieces, not their
 * colors (pure): a Floppy Ghost, all silver, each piece a sticker framed by
 * its black body. The piece that never moves (its anchor, the Ghost's
 * pentagon) is found round the frame's middle, its corners where its
 * sides meet (outlineAnchor.ts); they place the whole model on the picture
 * (outlineFit.ts), once for each way it may be held (turned by an
 * `order`th of a turn, or seen from the back). Each slot round it can hold
 * but a few poses (a piece, either way up): each is matched where it would
 * stand (outlineMatch.ts: its sticker's sides light inside, dark outside),
 * and the state whose poses match best, over every state and every hold,
 * is the one read. No pose is chosen alone: a slot misread is put right by
 * the others, since a piece stands in one slot only.
 */

/** How a model is read by its outlines (`PuzzleModel.scan`). */
export interface OutlineScan {
  /** Every state it can stand in. */
  readonly states: () => readonly Cube[]
  /** A piece where it stands, seen from the front: its outline and its
   *  sticker (inside its black frame), counterclockwise, in the model's
   *  frame (its anchor's middle at the origin). */
  readonly pose: (cubie: Cubie) => {
    readonly outline: readonly P2[]
    readonly sticker: readonly P2[]
  }
  /** The piece that never moves, a regular polygon of `order` sides (it
   *  looks the same turned by an `order`th of a turn, or seen from the
   *  back). */
  readonly anchor: number
  readonly order: number
  /** How far a sticker lies inside its piece's edge along a seam (half
   *  the seam's width). */
  readonly border: number
  /** Where it is always cut, whatever its state (in the model's frame):
   *  a seam, a dark band between two stickers, which sets its fit right
   *  (asked when read, not when loaded). */
  readonly seams: () => readonly (readonly [P2, P2])[]
}

/** A picture's lightness (0 to 100), row by row. */
export interface Picture {
  readonly width: number
  readonly height: number
  readonly light: ArrayLike<number>
}

export type OutlineReading = { ok: true; cube: Cube } | { ok: false }

interface Pose {
  readonly outline: readonly P2[]
  readonly sticker: readonly P2[]
  /** The slot it stands in (its position). */
  readonly slot: string
}

interface Poses {
  readonly poses: readonly Pose[]
  /** Each state's poses, one per piece. */
  readonly of: readonly Int32Array[]
  readonly states: readonly Cube[]
  /** Half the side of the square every pose fits in. */
  readonly reach: number
}

const POSES = new WeakMap<OutlineScan, Poses>()

/** Each piece's poses over every state (memoized). */
function posesOf(scan: OutlineScan): Poses {
  let found = POSES.get(scan)
  if (found) return found
  const ids = new Map<string, number>()
  const poses: Pose[] = []
  const states = scan.states()
  const of = states.map((cube) =>
    Int32Array.from(cube, (cubie) => {
      const { outline, sticker } = scan.pose(cubie)
      const key = outline.map((p) => p.map((x) => x.toFixed(4)).join()).join(';')
      let id = ids.get(key)
      if (id === undefined) {
        id = poses.length
        ids.set(key, id)
        poses.push({ outline, sticker, slot: cubie.position.join() })
      }
      return id
    }),
  )
  const reach = Math.max(...poses.flatMap((p) => p.outline.flat().map(Math.abs)))
  found = { poses, of, states, reach }
  POSES.set(scan, found)
  return found
}

/** The anchor's sticker in the model, its corners counterclockwise from
 *  the first past the x axis. */
function anchorCorners(scan: OutlineScan): P2[] {
  const { poses, of } = posesOf(scan)
  const corners = [...poses[of[0]![scan.anchor]!]!.sticker]
  return corners.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]))
}

/** Where its anchor goes in a frame `size` units wide (y down): the
 *  shape marked there, which the user puts it in. */
export function outlineMark(scan: OutlineScan, size: number): P2[] {
  const unit = size / (2 * posesOf(scan).reach)
  return posesOf(scan).poses[posesOf(scan).of[0]![scan.anchor]!]!.sticker.map(([x, y]) => [
    size / 2 + x * unit,
    size / 2 - y * unit,
  ])
}

/** Half the side of the frame a puzzle read by its outlines is shown in,
 *  in its model's units: every state fits. */
export const outlineReach = (scan: OutlineScan): number => posesOf(scan).reach

/** How far the anchor seen may lie from its mark, and be bigger or
 *  smaller, or turned, to take the picture. */
const MARK_OFF = 0.06
const MARK_SIZE = 0.15
const MARK_TURN = (12 * Math.PI) / 180

/** How big and how turned a polygon is round its middle. */
function spread(corners: readonly P2[], middle: P2, order: number) {
  const radius = corners.reduce((s, p) => s + Math.hypot(p[0] - middle[0], p[1] - middle[1]), 0)
  // Its corners' angles, an `order`th of a turn folded away (y up).
  let [re, im] = [0, 0]
  for (const [x, y] of corners) {
    const a = order * Math.atan2(middle[1] - y, x - middle[0])
    re += Math.cos(a)
    im += Math.sin(a)
  }
  return { radius: radius / corners.length, turn: Math.atan2(im, re) / order }
}

/** Whether the anchor shows in its mark, near enough to take the picture. */
export function anchorInMark(scan: OutlineScan, picture: Picture): boolean {
  const seen = findAnchor(picture, scan.order)
  if (!seen) return false
  const size = Math.min(picture.width, picture.height)
  const mark = outlineMark(scan, size)
  const center: P2 = [picture.width / 2, picture.height / 2]
  const offset = Math.hypot(seen.middle[0] - center[0], seen.middle[1] - center[1])
  const [now, want] = [
    spread(seen.corners, seen.middle, scan.order),
    spread(mark, center, scan.order),
  ]
  const d = scan.order * (now.turn - want.turn)
  return (
    offset < MARK_OFF * size &&
    Math.abs(now.radius / want.radius - 1) < MARK_SIZE &&
    Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) / scan.order < MARK_TURN
  )
}

/** A piece as read, on the picture: its outline, its sticker where it
 *  matched, its cost; and the pose that came next in its slot. */
interface PieceSeen {
  readonly outline: readonly P2[]
  readonly sticker: readonly P2[]
  readonly cost: number
  readonly second?: { readonly sticker: readonly P2[]; readonly cost: number }
}

/** What a reading saw, to show it (`?scandebug`): the anchor's corners,
 *  the seams found, each piece of the state read, and how much worse the next best state
 *  matched (the reading's confidence). */
export interface OutlinesSeen {
  readonly cube: Cube
  readonly anchor: AnchorSeen
  readonly seams: readonly SeamPoint[]
  readonly pieces: readonly PieceSeen[]
  readonly margin: number
}

/** How far the anchor's fit may leave its corners (model units), how
 *  much bigger or smaller than the frame says the puzzle may be, and the
 *  least contrast between a sticker and its frame. */
const FIT_OFF = 0.1
const ZOOM = 1.6
const LEAST_CONTRAST = 4
/** How far a pose may slide from where the fit puts it, as a share of the
 *  picture's side, in three steps each way. */
const SLIDE = 0.012
/** The most pixels a probe lies off a sticker's side. */
const DEPTH = 6

/** A puzzle read by its outlines from a picture of its front (or its
 *  back), its anchor round the middle, and what the reading saw; none when
 *  no anchor shows there. */
export function seeOutlines(scan: OutlineScan, picture: Picture): OutlinesSeen | undefined {
  const { poses, of, states, reach } = posesOf(scan)
  const anchor = findAnchor(picture, scan.order)
  if (!anchor) return undefined
  const model = anchorCorners(scan)
  const anchorPose = poses[of[0]![scan.anchor]!]!
  const n = scan.order
  const size = Math.min(picture.width, picture.height)
  const nominal = size / (2 * reach)
  const slide = SLIDE * size
  const step = Math.max(1, slide / 3)

  // Fitted once on the anchor's corners, then on the seams.
  const first = fitAffine(model, anchor.corners)
  const scale = scaleOf(first.map)
  if (first.off > FIT_OFF * scale || scale < nominal / ZOOM || scale > nominal * ZOOM)
    return undefined
  // Probed half way into the black frame, or a few pixels (a thin sticker
  // on a small picture).
  const depth = Math.min(scan.border / 2, DEPTH / scale)
  const contrast = contrastOf(
    picture,
    probesOf(anchorPose.outline, anchorPose.sticker, first.map, depth),
  )
  if (contrast < LEAST_CONTRAST) return undefined
  const { map: fitted, seams } = fitSeams(
    picture,
    first.map,
    scan.seams(),
    2 * scan.border,
    contrast,
  )
  // Each other way to hold it: the anchor (and its seams) turned onto
  // itself, its corner i where corner k + i was (or k - i, from the back).
  const holds: { map: PlaneMap; matches: Match[] }[] = []
  for (const mirrored of [false, true])
    for (let k = 0; k < n; k++) {
      const onto = model.map((_, i) => model[(((mirrored ? k - i : k + i) % n) + n) % n]!)
      const map = compose(fitted, fitAffine(model, onto).map)
      const matches = poses.map((pose) =>
        matchPose(picture, probesOf(pose.outline, pose.sticker, map, depth), contrast, slide, step),
      )
      holds.push({ map, matches })
    }

  // The best state over every hold, and the best of the other states.
  let best = { cost: Infinity, state: -1, hold: -1 }
  let next = Infinity
  holds.forEach(({ matches }, hold) => {
    of.forEach((ids, state) => {
      let cost = 0
      for (const id of ids) cost += matches[id]!.cost
      if (cost < best.cost) {
        if (state !== best.state) next = best.cost
        best = { cost, state, hold }
      } else if (state !== best.state && cost < next) next = cost
    })
  })
  const { map, matches } = holds[best.hold]!
  const shown = (polygon: readonly P2[], [dx, dy]: P2 = [0, 0]) =>
    polygon.map((p): P2 => {
      const [x, y] = apply(map, p)
      return [x + dx, y + dy]
    })
  const pieces = Array.from(of[best.state]!, (id): PieceSeen => {
    const pose = poses[id]!
    const others = poses
      .map((other, j) => ({ other, j }))
      .filter(({ other, j }) => j !== id && other.slot === pose.slot)
      .sort((a, b) => matches[a.j]!.cost - matches[b.j]!.cost)
    const second = others[0]
    return {
      outline: shown(pose.outline),
      sticker: shown(pose.sticker, matches[id]!.shift),
      cost: matches[id]!.cost,
      ...(second && {
        second: {
          sticker: shown(second.other.sticker, matches[second.j]!.shift),
          cost: matches[second.j]!.cost,
        },
      }),
    }
  })
  return { cube: states[best.state]!, anchor, seams, pieces, margin: next - best.cost }
}

/** A puzzle read by its outlines: the state seen (`seeOutlines`). */
export function readOutlines(scan: OutlineScan, picture: Picture): OutlineReading {
  const seen = seeOutlines(scan, picture)
  return seen ? { ok: true, cube: seen.cube } : { ok: false }
}
