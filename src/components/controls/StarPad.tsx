import { formatMove } from '@/lib/moves'
import type { StarMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'
import { PadHeader } from './PadHeader'

/**
 * Rotation pad of the star prism: its top and bottom layers by one piece
 * either way, and the slash. Hovering or focusing a button highlights the
 * pieces it would turn, like the cube pad.
 */
export function StarPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const pushMove = useCube((s) => s.pushMove)
  const setPreview = useView((s) => s.setPreview)

  const button = (move: StarMove, title: string, className = '') => (
    <div
      className={`flex ${className}`}
      onPointerEnter={() => setPreview(move)}
      onPointerLeave={() => setPreview(null)}
    >
      <Button
        disabled={disabled}
        onFocus={() => setPreview(move)}
        onBlur={() => setPreview(null)}
        onClick={() => pushMove(move)}
        className="flex-1"
        aria-label={title}
        title={title}
      >
        {formatMove(move, labels)}
      </Button>
    </div>
  )
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-2 gap-2">
        {button({ ring: 'U', amount: 1 }, t.starTurnTitle('top', true))}
        {button({ ring: 'U', amount: 5 }, t.starTurnTitle('top', false))}
        {button({ ring: 'D', amount: 1 }, t.starTurnTitle('bottom', true))}
        {button({ ring: 'D', amount: 5 }, t.starTurnTitle('bottom', false))}
        {button({ slash: true }, t.slashTitle, 'col-span-2')}
      </div>
    </div>
  )
}
