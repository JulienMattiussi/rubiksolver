import { Locate } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { useView } from '@/store/viewStore'
import { IconButton } from '@/components/ui/IconButton'

/** Recenters the 3D view (animated) via the view store. */
export function RecenterButton() {
  const t = useI18n((s) => s.t)
  const resetView = useView((s) => s.resetView)
  return (
    <IconButton label={t.recenter} onClick={resetView}>
      <Locate className="size-4" aria-hidden />
    </IconButton>
  )
}
