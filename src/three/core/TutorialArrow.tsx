import { Line } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { PLACE as ARROW } from './colors'

/** A face's center, from its cell's (half a cell out, a hair over it). */
const FACE = 0.52
/** The puzzle's half side (its drawing's), and how far off it the line
 *  keeps at least. */
const HALF = 1.5
const GAP = 0.2
/** The head's length, and the margin: the straight run out of each face,
 *  and how much wider than the way between the faces the circle is. */
const HEAD = 0.34
const MARGIN = 0.45
/** How much the circle's top leans toward the viewer (so the arrow shows
 *  where its ends face apart), and how much wider it is drawn each try
 *  until it clears the puzzle. */
const LEAN = 0.5
/** How near the puzzle's center the middle of the two faces lies when they
 *  face apart (opposite faces: about none; side by side: a cell and more). */
const NEAR_CENTER = 0.9
const WIDER = 1.2
const TRIES = 12
/** Points along the circle, and where each end joins it (its angle off
 *  the line between the faces). */
const SAMPLES = 48
const JOIN = Math.PI / 4

const v = () => new THREE.Vector3()

/** Whether a point is off the puzzle by the gap (its box, exactly). */
const clear = (p: THREE.Vector3) =>
  Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)) >= HALF + GAP

/** A curve from `p` leaving along `dp` to `q` arriving along `dq`. */
function joining(p: THREE.Vector3, dp: THREE.Vector3, q: THREE.Vector3, dq: THREE.Vector3) {
  const k = p.distanceTo(q) / 3
  return new THREE.CubicBezierCurve3(
    p,
    p.clone().addScaledVector(dp, k),
    q.clone().addScaledVector(dq, -k),
    q,
  ).getPoints(16)
}

/** A unit vector square to `u`, as near `d` as can be (`fallback` if `d`
 *  runs along `u`). */
function across(d: THREE.Vector3, u: THREE.Vector3, fallback: THREE.Vector3) {
  const w = d.clone().addScaledVector(u, -d.dot(u))
  if (w.lengthSq() > 1e-6) return w.normalize()
  const f = fallback.clone().addScaledVector(u, -fallback.dot(u))
  return f.lengthSq() > 1e-6 ? f.normalize() : new THREE.Vector3(0, 1, 0).cross(u).normalize()
}

/**
 * The whole line, from the first face's center (`a`, normal `n1`) to the
 * second's (`b`, normal `n2`; the line ends at the head's base, `base`).
 * Its middle is half a circle centered between the two faces (`m`), as
 * wide as the way between them plus the margin, standing on the side away
 * from the puzzle's center (leaning to the viewer; across the view for
 * faces apart, whose middle is near the center): it rises from beside
 * `a` to its top `e` and comes down beside `b`. Each end leaves its face
 * straight out over the margin, then joins the circle by a curve, so
 * there is no angle anywhere. Drawn wider until the whole line clears the
 * puzzle.
 */
function arrowLine(
  a: THREE.Vector3,
  n1: THREE.Vector3,
  b: THREE.Vector3,
  base: THREE.Vector3,
  n2: THREE.Vector3,
  view: THREE.Vector3,
): THREE.Vector3[] {
  const m = v().addVectors(a, b).multiplyScalar(0.5)
  const u = a.distanceTo(b) > 1e-6 ? v().subVectors(a, m).normalize() : across(n1, n1, view)
  // Its side: away from the center, unless the middle sits near it (faces
  // apart); then across the view, so the circle shows whole on screen
  // rather than edge on, a line through the puzzle.
  const flat = across(v().crossVectors(view, u), u, view)
  const out =
    m.length() < NEAR_CENTER
      ? flat.multiplyScalar(flat.dot(m) < 0 ? -1 : 1)
      : across(m.clone().addScaledVector(view, LEAN), u, view)
  const leaveFrom = a.clone().addScaledVector(n1, MARGIN)
  const landAt = base.clone().addScaledVector(n2, MARGIN)
  let radius = a.distanceTo(m) + MARGIN
  let line: THREE.Vector3[] = [a, leaveFrom, landAt, base]
  for (let k = 0; k < TRIES; k++, radius *= WIDER) {
    // From beside a (angle 0) over the top (a quarter) to beside b (a half).
    const at = (angle: number) =>
      m
        .clone()
        .addScaledVector(u, radius * Math.cos(angle))
        .addScaledVector(out, radius * Math.sin(angle))
    const tangent = (angle: number) =>
      u.clone().multiplyScalar(-Math.sin(angle)).addScaledVector(out, Math.cos(angle))
    const middle = Array.from({ length: SAMPLES + 1 }, (_, i) =>
      at(JOIN + ((Math.PI - 2 * JOIN) * i) / SAMPLES),
    )
    const leave = joining(leaveFrom, n1, at(JOIN), tangent(JOIN))
    const land = joining(at(Math.PI - JOIN), tangent(Math.PI - JOIN), landAt, n2.clone().negate())
    line = [a, ...leave, ...middle.slice(1, -1), ...land, base]
    // The ends sit on their faces: only what lies past their straight runs
    // must clear.
    if (line.slice(1, -1).every(clear)) return line
  }
  return line
}

type V3 = readonly [number, number, number]

/** The head's and the start dot's shapes, drawn twice: plain where seen,
 *  faint through the puzzle. */
function Marks({
  head,
  quaternion,
  start,
  hidden,
}: {
  head: THREE.Vector3
  quaternion: THREE.Quaternion
  start: THREE.Vector3
  hidden: boolean
}) {
  const material = hidden ? (
    <meshBasicMaterial color={ARROW} depthTest={false} transparent opacity={0.35} />
  ) : (
    <meshBasicMaterial color={ARROW} />
  )
  return (
    <>
      <mesh position={head} quaternion={quaternion} renderOrder={hidden ? 9 : 10}>
        <coneGeometry args={[0.15, HEAD, 16]} />
        {material}
      </mesh>
      <mesh position={start} renderOrder={hidden ? 9 : 10}>
        <sphereGeometry args={[0.09, 16, 8]} />
        {material}
      </mesh>
    </>
  )
}

/**
 * A tutorial's arrow, from a sticker's face to the face it lands on (the
 * centers of their faces, in the puzzle's drawing frame): it leaves the
 * first straight out, follows a circle bowing out from the puzzle (clear
 * of it, see `arrowLine`), and comes straight into the second, its head
 * there. Where the puzzle hides
 * it, it shows dotted.
 */
export function TutorialArrow({
  from,
  fromNormal,
  to,
  toNormal,
}: {
  from: V3
  fromNormal: V3
  to: V3
  toNormal: V3
}) {
  const camera = useThree((s) => s.camera)
  const view = camera.position.clone().normalize()
  const viewKey = view
    .toArray()
    .map((v) => v.toFixed(1))
    .join()
  const { start, points, head, quaternion } = useMemo(() => {
    const n1 = new THREE.Vector3(...fromNormal)
    const n2 = new THREE.Vector3(...toNormal)
    const start = new THREE.Vector3(...from).addScaledVector(n1, FACE)
    const end = new THREE.Vector3(...to).addScaledVector(n2, FACE)
    // The head: its tip on the face's center, pointing in; the line ends at
    // its base's center.
    const head = end.clone().addScaledVector(n2, HEAD / 2)
    const base = end.clone().addScaledVector(n2, HEAD)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      n2.clone().negate(),
    )
    const points = arrowLine(start, n1, end, base, n2, view)
    return { start, points, head, quaternion }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `viewKey` stands for `view`
  }, [from, fromNormal, to, toNormal, viewKey])
  const curve = { points, color: ARROW, lineWidth: 4 }
  return (
    <group>
      {/* Dotted through the puzzle, plain over it where nothing hides it. */}
      <Line {...curve} dashed dashSize={0.08} gapSize={0.1} depthTest={false} renderOrder={9} />
      <Line {...curve} renderOrder={10} />
      <Marks head={head} quaternion={quaternion} start={start} hidden />
      <Marks head={head} quaternion={quaternion} start={start} hidden={false} />
    </group>
  )
}
