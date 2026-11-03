/** An SVG path along a convex polygon, its corners rounded by `radius` px
 *  (as `rounded-2xl` rounds a card's): a quadratic curve at each corner,
 *  from and to `radius` along its two sides. */
export function roundedPath(
  points: readonly (readonly [number, number])[],
  radius: number,
): string {
  const n = points.length
  const toward = (from: readonly [number, number], to: readonly [number, number]) => {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1])
    const r = Math.min(radius, length / 2) / length
    return [from[0] + (to[0] - from[0]) * r, from[1] + (to[1] - from[1]) * r] as const
  }
  return (
    points
      .map((corner, i) => {
        const before = toward(corner, points[(i + n - 1) % n]!)
        const after = toward(corner, points[(i + 1) % n]!)
        return `${i ? 'L' : 'M'}${before[0]},${before[1]} Q${corner[0]},${corner[1]} ${after[0]},${after[1]}`
      })
      .join(' ') + ' Z'
  )
}
