import { GraduationCap } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { tutorialFor } from '@/lib/tutorials/registry'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'

/** The button starting the tutorial of the method chosen, when it has one
 *  (none otherwise); nothing to teach on a solved puzzle. In the solve
 *  block, and in the phone's folded bar. */
export function TutorialButton({ className = '' }: { className?: string }) {
  const t = useI18n((s) => s.t)
  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const has = useCube((s) => tutorialFor(cubeShape(s.cube), s.method) !== undefined)
  const start = useTutorialStore((s) => s.start)
  // Already on (the folded bar shows during it): nothing to start.
  const active = useTutorialStore((s) => s.active)
  const unfold = useView((s) => s.setFolded)
  if (!has || active) return null
  return (
    <Button
      variant="solveOutline"
      onClick={() => {
        start()
        // A phone's folded panel opens on it: the tutorial is read there.
        unfold(false)
      }}
      disabled={busy || solved}
      title={t.tutorial.buttonTitle}
      className={className}
    >
      <GraduationCap className="size-4" aria-hidden />
      {t.tutorial.button}
    </Button>
  )
}
