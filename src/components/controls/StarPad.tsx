import { cubeShape } from '@/lib/cube'
import { formatMove } from '@/lib/moves'
import { STAR_RINGS } from '@/lib/star'
import { isStar, type StarMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'

/**
 * Rotation pad of a star prism: each of its layers (two, or four on the
 * 4-star) by one piece either way, and the slash. Hovering or focusing a button highlights the
 * pieces it would turn, like the cube pad.
 */
export function StarPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const pushMove = useCube((s) => s.pushMove)
  const shape = useCube((s) => cubeShape(s.cube))
  const setPreview = useView((s) => s.setPreview)

  const button = (move: StarMove, title: string, ghost = false) => (
    <div
      key={JSON.stringify(move)}
      className="flex flex-1"
      onPointerEnter={() => setPreview(move)}
      onPointerLeave={() => setPreview(null)}
    >
      <Button
        disabled={disabled}
        onFocus={() => setPreview(move)}
        onBlur={() => setPreview(null)}
        onClick={() => pushMove(move)}
        variant={ghost ? 'ghost' : undefined}
        className="flex-1 rounded-none px-2 whitespace-nowrap"
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
        {(isStar(shape) ? STAR_RINGS[shape] : []).map((ring) => (
          <div key={ring} className={TURN_PAIR}>
            {button({ ring, amount: 1 }, t.starTurnTitle(ring, true))}
            {button({ ring, amount: 5 }, t.starTurnTitle(ring, false), true)}
          </div>
        ))}
        <div className={`col-span-2 ${TURN_PAIR}`}>{button({ slash: true }, t.slashTitle)}</div>
      </div>
    </div>
  )
}
