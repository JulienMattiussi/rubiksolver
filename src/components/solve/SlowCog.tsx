import { Cog } from 'lucide-react'
import { useEffect, useState } from 'react'

/** After this long computing, a solution is slow: the big cog shows. */
const SLOW_MS = 4000

/** Over the steps while a solution takes long to compute: a big turning cog
 *  that grows and fades in, so a slow puzzle (the Gear Cube Extreme) does
 *  not look stuck. Nothing for a quick one. */
export function SlowCog({ computing }: { computing: boolean }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!computing) return
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [computing])
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/60 transition duration-1000 ${
        slow ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Cog
        className={`size-24 text-amber-300/90 transition-transform duration-1000 motion-safe:animate-spin motion-safe:[animation-duration:3s] ${
          slow ? 'scale-100' : 'scale-50'
        }`}
      />
    </div>
  )
}
