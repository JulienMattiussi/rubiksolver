import { BookA, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { CubeShape } from '@/lib/core/shapes'
import type { Term, Tutorial } from '@/lib/teach/tutorial'
import { Bolded } from '@/components/ui/Bolded'
import { Modal } from '@/components/ui/Modal'
import { LegendGrid } from './LegendGrid'
import { TermDemo } from './TermDemo'
import { useTutorialTexts } from './useTutorialTexts'

/** The glossary at hand from any step: an icon beside the step's title,
 *  opening over the page its words one after the other (their pieces lit
 *  on its own pages only), then the pieces' legend, if any. */
export function GlossaryButton({
  tutorial,
  terms,
  shape,
}: {
  tutorial: Tutorial
  terms: readonly Term[]
  shape: CubeShape
}) {
  const tx = useTutorialTexts()
  const [open, setOpen] = useState(false)
  const titleId = useId()
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={tx.glossaryOpen}
        aria-label={tx.glossaryOpen}
        className="shrink-0 rounded p-1 text-amber-300 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        <BookA className="size-4" aria-hidden />
      </button>
      {open && (
        <Modal labelledBy={titleId} onClose={() => setOpen(false)} width="max-w-md">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="flex items-center gap-2 text-sm font-semibold text-white">
              <BookA className="size-4 text-amber-300" aria-hidden />
              {tx.glossary}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title={tx.glossaryClose}
              aria-label={tx.glossaryClose}
              className="rounded p-1 text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-3 max-h-[70vh] overflow-y-auto">
            <ul className="space-y-3">
              {terms.map((term) => (
                <li key={term.key} className="text-sm leading-relaxed text-slate-200">
                  <Bolded text={tx.term(term.key)} />
                  {term.demo && <TermDemo turn={term.demo} />}
                </li>
              ))}
            </ul>
            {tutorial.legend && (
              <section className={terms.length > 0 ? 'mt-4 border-t border-slate-700 pt-3' : ''}>
                <h3 className="text-sm font-semibold text-white">{tx.legend}</h3>
                <LegendGrid tutorial={tutorial} shape={shape} />
              </section>
            )}
          </div>
        </Modal>
      )}
    </>
  )
}
