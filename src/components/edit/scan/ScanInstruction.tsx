import { useEffect, useRef, type ReactNode } from 'react'

/** Where a scan's instruction stands: hidden (a 💪 plays), big in front of
 *  the picture (just shown), or in its place on top, out of the way. */
export type InstructionStage = 'hidden' | 'front' | 'top'

const STAGES: Record<InstructionStage, string> = {
  hidden: 'top-1/2 -translate-y-1/2 text-2xl opacity-0 duration-0',
  front: 'top-1/2 -translate-y-1/2 text-2xl opacity-100 duration-300',
  top: 'top-11 translate-y-0 text-base opacity-100 duration-700',
}

/** Where the card stands on top, in pixels (`top-11`). */
const TOP_PX = 44

/** The instruction of a scan, in a card that stands out on the picture:
 *  shown big in front first, then moved up to its place (`stage`), where
 *  it tells how far down it reaches (`onBottom`: the frame goes below). */
export function ScanInstruction({
  stage,
  onBottom,
  children,
}: {
  stage: InstructionStage
  onBottom?: (bottom: number) => void
  children: ReactNode
}) {
  const card = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = card.current
    if (stage !== 'top' || !el || !onBottom) return
    const tell = () => onBottom(TOP_PX + el.offsetHeight)
    tell()
    if (typeof ResizeObserver === 'undefined') return
    const watching = new ResizeObserver(tell)
    watching.observe(el)
    return () => watching.disconnect()
  }, [stage, onBottom])
  return (
    <div
      ref={card}
      className={`absolute inset-x-4 mx-auto flex max-w-xl flex-col gap-2 rounded-xl bg-black/75 px-4 py-3 text-center font-semibold leading-snug shadow-xl ring-1 ring-white/15 transition-all ease-in-out ${STAGES[stage]}`}
      aria-live="polite"
    >
      {children}
    </div>
  )
}
