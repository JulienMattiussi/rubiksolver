import { Camera, FlaskConical } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { tellsSizes } from '@/lib/core/shape'
import { SHAPE_SCAN_TRIED } from '@/lib/core/shapes'
import { scannable } from '@/lib/editor/scan/plan'
import { useI18n } from '@/i18n/i18nStore'
import { hasCamera } from '@/hooks/useCamera'
import { useCube } from '@/store/cubeStore'
import { useScan } from '@/store/scanStore'
import { Button } from '@/components/ui/Button'
import { ScanView } from './ScanView'

/** « Use the camera », where the puzzle can be scanned (lib/editor/scan/;
 *  a mirror by its stickers' sizes, where its card says so), a flask on it
 *  until the scan was tried on the real puzzle; and the scan itself, once
 *  started. */
export function ScanButton() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  const scanning = useScan((s) => s.open)
  const start = useScan((s) => s.start)
  if (!scannable(shape, variant) || !hasCamera()) return null
  // A mirror's scan, by its stickers' sizes, tried on the 3x3 (the only one
  // that scans so, 2026-10-24).
  const untried = !tellsSizes(variant) && !SHAPE_SCAN_TRIED[shape]
  return (
    <>
      {/* Not again while it is open: the space bar, taking a face, would
          otherwise press this button behind it and start over. */}
      <Button variant="edit" onClick={() => !useScan.getState().open && start()}>
        <Camera className="size-4" aria-hidden />
        {t.scanStart}
        {untried && (
          <span title={t.scanUntried} role="img" aria-label={t.scanUntried}>
            <FlaskConical className="size-4 text-amber-300" aria-hidden />
          </span>
        )}
      </Button>
      {scanning && <ScanView />}
    </>
  )
}
