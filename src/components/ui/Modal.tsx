import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  /** 'alertdialog' when it asks to confirm something, 'dialog' otherwise. */
  role?: 'dialog' | 'alertdialog'
  /** Id of the element naming the dialog (its title). */
  labelledBy: string
  describedBy?: string
  /** What gets the focus on opening; the dialog's first button otherwise. */
  initialFocus?: RefObject<HTMLElement | null>
  onClose: () => void
  /** Width of the dialog box (Tailwind classes). */
  width?: string
  children: ReactNode
}

/**
 * A dialog over the whole page (portal). It takes the focus on opening and
 * gives it back on closing; Escape or a click on the backdrop closes it.
 * Mount it only while open.
 */
export function Modal({
  role = 'dialog',
  labelledBy,
  describedBy,
  initialFocus,
  onClose,
  width = 'max-w-sm',
  children,
}: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  // Latest handler, so the effect below runs once per opening.
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const target = initialFocus?.current ?? boxRef.current?.querySelector<HTMLElement>('button')
    target?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus() // give focus back to whatever opened the dialog
    }
    // Once per opening: the focus target is read at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onClick={onClose}
    >
      <div
        ref={boxRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`max-h-full w-full overflow-auto rounded-xl border border-slate-700/60 bg-slate-900 p-4 shadow-xl ${width}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
