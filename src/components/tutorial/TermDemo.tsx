import { useMemo, useRef } from 'react'
import { cubeShape, solvedCube } from '@/lib/core/cube'
import type { Turn } from '@/lib/core/types'
import { useCube } from '@/store/cubeStore'
import { GuideCanvas } from '@/three/guide/GuideCanvas'

/** A turn playing over and over on the puzzle solved, as the move guide
 *  shows it (a glossary's way of turning). */
export function TermDemo({ turn }: { turn: Turn }) {
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  const cube = useMemo(() => solvedCube(shape), [shape])
  const box = useRef<HTMLDivElement>(null)
  return (
    <div className="relative mt-2 h-36 overflow-hidden rounded-lg bg-slate-800" aria-hidden>
      <div ref={box} className="absolute inset-0" />
      <GuideCanvas
        tiles={[{ key: 'demo', track: () => box.current, cube, variant, turn, playing: true }]}
      />
    </div>
  )
}
