import { Cog, Shuffle } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectScrambling, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { Button } from '@/components/ui/Button'

/** Scramble: a turning cog while the scramble plays; locked during the
 *  tutorial, which follows the cube it began on. */
export function ScrambleButton({ className = '' }: { className?: string }) {
  const t = useI18n((s) => s.t)
  const scramble = useCube((s) => s.scramble)
  const busy = useCube(selectBusy)
  const scrambling = useCube(selectScrambling)
  const tutorial = useTutorialStore((s) => s.active)
  const Icon = scrambling ? Cog : Shuffle
  return (
    <Button
      onClick={scramble}
      disabled={busy || tutorial}
      aria-busy={scrambling}
      title={tutorial ? t.tutorial.locked : undefined}
      className={className}
    >
      <Icon className={`size-4 ${scrambling ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
      {t.scramble}
    </Button>
  )
}
