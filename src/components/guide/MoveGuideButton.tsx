import { useState } from 'react'
import { useI18n } from '@/i18n/i18nStore'
import { Button } from '@/components/ui/Button'
import { FEATURE_ICON } from '@/components/ui/features'
import { MoveGuideDialog } from './MoveGuideDialog'

/** Opens the move guide of the current puzzle. */
export function MoveGuideButton() {
  const t = useI18n((s) => s.t)
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="guide"
        className="mb-2 w-full"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <FEATURE_ICON.guide className="size-4" aria-hidden />
        {t.moveGuide}
      </Button>
      {open && <MoveGuideDialog onClose={() => setOpen(false)} />}
    </>
  )
}
