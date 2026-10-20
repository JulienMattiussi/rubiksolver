import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { PerspectiveCamera } from 'three'

/** The panel's pace (its `unfold` and `fold` animations, index.css), in
 *  seconds. */
const DURATION = 0.3

/** As the panel moves: rising, ease-out; going down, ease-in. */
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeIn = (t: number) => t ** 3

/**
 * The puzzle framed in the canvas's top part only, the rest under a phone's
 * panel (`bottom`: how much of the canvas, in px from its bottom, the panel
 * covers): the camera sees as if the canvas ended there, its view running
 * on below. The framing moves to a new `bottom` as the panel does (same
 * time, same curve), so the puzzle shrinks, grows and recenters with it;
 * the canvas itself keeps its size.
 */
export function ViewRegion({ bottom }: { bottom: number }) {
  // The move under way: from where, to where, for how long so far.
  const move = useRef({ from: bottom, to: bottom, elapsed: DURATION })
  useFrame(({ camera, size }, delta) => {
    const m = move.current
    if (m.to !== bottom) {
      const t = Math.min(1, m.elapsed / DURATION)
      const at = m.from + (m.to - m.from) * (m.to > m.from ? easeOut(t) : easeIn(t))
      move.current = { from: at, to: bottom, elapsed: 0 }
    }
    const now = move.current
    now.elapsed += delta
    const t = Math.min(1, now.elapsed / DURATION)
    const shown = Math.min(
      size.height - 1,
      now.from + (now.to - now.from) * (now.to > now.from ? easeOut(t) : easeIn(t)),
    )
    const lens = camera as PerspectiveCamera
    if (shown <= 0) {
      if (lens.view) {
        lens.clearViewOffset()
        lens.aspect = size.width / size.height
        lens.updateProjectionMatrix()
      }
      return
    }
    const height = size.height - shown
    lens.aspect = size.width / height
    lens.setViewOffset(size.width, height, 0, 0, size.width, size.height)
  })
  return null
}
