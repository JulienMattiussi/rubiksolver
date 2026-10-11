import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { Button } from '@/components/ui/Button'
import { MoveGuideDialog } from './MoveGuideDialog'

/** Opens the move guide of the current puzzle. */
export function MoveGuideButton() {
  const t = useI18n((s) => s.t)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        className="mb-2 w-full border border-slate-700"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <BookOpen className="size-4" aria-hidden />
        {t.moveGuide}
      </Button>
      {open && <MoveGuideDialog onClose={() => setOpen(false)} />}
    </>
  )
}
