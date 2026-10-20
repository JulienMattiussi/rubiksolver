import { Shapes, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { CubeShape } from '@/lib/core/shapes'
import type { Tutorial } from '@/lib/teach/tutorial'
import { Modal } from '@/components/ui/Modal'
import { LegendGrid } from './LegendGrid'
import { useTutorialTexts } from './useTutorialTexts'

/** The legend's icon: on its button, its page and its window alike. */
export const LegendIcon = ({ className }: { className: string }) => (
  <Shapes className={className} aria-hidden />
)

/** The legend at hand from any step: an icon opening it over the page. */
export function LegendButton({ tutorial, shape }: { tutorial: Tutorial; shape: CubeShape }) {
  const tx = useTutorialTexts()
  const [open, setOpen] = useState(false)
  const titleId = useId()
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={tx.legendOpen}
        aria-label={tx.legendOpen}
        className="shrink-0 rounded p-1 text-amber-300 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        <LegendIcon className="size-4" />
      </button>
      {open && (
        <Modal labelledBy={titleId} onClose={() => setOpen(false)} width="max-w-md">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold text-white">
              <LegendIcon className="size-4 text-amber-300" />
              {tx.legend}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title={tx.legendClose}
              aria-label={tx.legendClose}
              className="rounded p-1 text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <LegendGrid tutorial={tutorial} shape={shape} />
        </Modal>
      )}
    </>
  )
}
