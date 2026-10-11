import { useId, useRef } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** Asks to confirm an action that overwrites something. The safe choice
 *  (cancel) has the focus first; Escape or the backdrop cancel. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Modal
      role="alertdialog"
      labelledBy={titleId}
      describedBy={messageId}
      initialFocus={cancelRef}
      onClose={onCancel}
    >
      <h2 id={titleId} className="text-sm font-semibold text-white">
        {title}
      </h2>
      <p id={messageId} className="mt-2 text-sm leading-relaxed text-slate-300">
        {message}
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button ref={cancelRef} variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
