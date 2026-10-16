import { useId } from 'react'

/** A small cube drawn hatched, as the tutorial draws the pieces a formula
 *  moves though not placed yet (the legend's picture). */
export function HatchedCubie({ className }: { className?: string }) {
  const stripes = useId()
  // Three faces seen from above, in a 24 x 24 box.
  const faces = ['12,2 22,7 12,12 2,7', '2,7 12,12 12,22 2,17', '12,12 22,7 22,17 12,22']
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <pattern
          id={stripes}
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="3" height="3" fill="#cbd5e1" />
          <rect width="1.3" height="3" fill="#334155" />
        </pattern>
      </defs>
      {faces.map((points, i) => (
        <polygon
          key={points}
          points={points}
          fill={`url(#${stripes})`}
          stroke="#0f172a"
          strokeWidth="1"
          strokeLinejoin="round"
          // The sides a little darker: the cube's shading.
          opacity={i === 0 ? 1 : i === 1 ? 0.75 : 0.9}
        />
      ))}
    </svg>
  )
}
