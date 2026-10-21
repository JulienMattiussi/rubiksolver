import type { ReactNode } from 'react'

/** Where a scan's instruction stands: hidden (a 💪 plays), big in front of
 *  the picture (just shown), or in its place on top, out of the way. */
export type InstructionStage = 'hidden' | 'front' | 'top'

const STAGES: Record<InstructionStage, string> = {
  hidden: 'top-1/2 -translate-y-1/2 text-2xl opacity-0 duration-0',
  front: 'top-1/2 -translate-y-1/2 text-2xl opacity-100 duration-300',
  top: 'top-11 translate-y-0 text-base opacity-100 duration-700',
}

/** The instruction of a scan, in a card that stands out on the picture:
 *  shown big in front first, then moved up to its place (`stage`). */
export function ScanInstruction({
  stage,
  children,
}: {
  stage: InstructionStage
  children: ReactNode
}) {
  return (
    <div
      className={`absolute inset-x-4 mx-auto flex max-w-xl flex-col gap-2 rounded-xl bg-black/75 px-4 py-3 text-center font-semibold leading-snug shadow-xl ring-1 ring-white/15 transition-all ease-in-out ${STAGES[stage]}`}
      aria-live="polite"
    >
      {children}
    </div>
  )
}
