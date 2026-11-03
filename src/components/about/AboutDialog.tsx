import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { useI18n } from '@/i18n/i18nStore'
import { IconButton } from '@/components/ui/IconButton'
import { useView } from '@/store/viewStore'
import { AboutText } from './AboutText'
import { useAbout } from './useAbout'

/**
 * The puzzle's page, whole, in a dialog (opened by AboutButton): a native
 * one, always in the page and only hidden while closed, so that its text is
 * there for a search engine as for the reader, without a copy of it. It
 * takes the focus and gives it back, Escape or a click beside it closes it.
 */
export function AboutDialog() {
  const t = useI18n((s) => s.t)
  const about = useAbout()
  const titleId = useId()
  const open = useView((s) => s.aboutOpen)
  const setAboutOpen = useView((s) => s.setAboutOpen)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const box = dialog.current
    if (!box || open === box.open) return
    if (open) box.showModal?.()
    else box.close?.()
  }, [open])
  const close = () => setAboutOpen(false)
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={close}
      // A click on the backdrop lands on the dialog itself.
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-xl border border-slate-700/60 bg-slate-900 p-4 text-left shadow-xl backdrop:bg-slate-950/70"
    >
      <header className="mb-3 flex items-center gap-2">
        <h2
          id={titleId}
          className="flex-1 text-xs font-semibold tracking-wide text-slate-400 uppercase"
        >
          {t.aboutPuzzle}
        </h2>
        <IconButton label={t.close} onClick={close}>
          <X className="size-4" aria-hidden />
        </IconButton>
      </header>
      <AboutText about={about} />
    </dialog>
  )
}
