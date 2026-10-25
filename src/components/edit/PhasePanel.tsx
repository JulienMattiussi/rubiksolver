import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { ErrorAlert } from './ErrorAlert'

/** A step of the entry before its colors (a setup, see setup.ts): its
 *  hint, its counter if it has one, its error if refused, then the buttons
 *  to accept it or cancel the entry. */
export function PhasePanel({
  top,
  hint,
  counter,
  error,
  accept,
  onAccept,
}: {
  /** Above the hint (a scan, which can do the step's work). */
  top?: ReactNode
  hint: string
  counter?: ReactNode
  /** The error to show, if the step was refused. */
  error: string | null
  /** The accept button's label. */
  accept: string
  onAccept: () => void
}) {
  const t = useI18n((s) => s.t)
  const cancel = useEditor((s) => s.cancel)
  return (
    <div className="flex flex-col gap-5">
      {top}
      <p className="text-xs leading-relaxed text-slate-400">{hint}</p>
      {counter}
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={onAccept} className="col-span-2">
          <Check className="size-4" aria-hidden />
          {accept}
        </Button>
        <Button onClick={cancel} className="col-span-2">
          <X className="size-4" aria-hidden />
          {t.cancel}
        </Button>
      </div>
    </div>
  )
}
