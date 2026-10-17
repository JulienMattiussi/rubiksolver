import { describeMove } from '@/lib/app/moveGuide'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/moves'
import { moveInHold, type Hold } from '@/lib/core/hold'
import type { Cube, Move } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { PadButton } from '@/components/controls/PadButton'
import { TURN_PAIR } from '@/components/ui/styles'

/** A formula move by move: each a pad button (a click plays it alone, as
 *  the pad's do), beside its words; or, `inline`, the buttons in a row, their
 *  words in their tooltips (a block repeated, short and seen often). While
 *  it is followed by hand, its first `done` moves are played (dimmed, off)
 *  and, `next`, the one after stands out. Each reads as the puzzle is
 *  held (`hold`): its letter and words where its side stands, the move it
 *  plays the puzzle's own. */
export function FormulaMoves({
  cube,
  moves,
  disabled,
  inline = false,
  done = 0,
  next = false,
  hold,
}: {
  cube: Cube
  moves: readonly Move[]
  disabled: boolean
  inline?: boolean
  done?: number
  next?: boolean
  hold: Hold
}) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const dims = cubeDims(cube)
  const shape = cubeShape(cube)
  const button = (m: Move, i: number, words: string) => (
    <div
      className={`${TURN_PAIR} w-10 ${i < done ? 'opacity-40' : ''} ${
        next && i === done ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : ''
      }`}
    >
      <PadButton
        move={m}
        label={formatMove(moveInHold(hold, m), labels, dims, shape)}
        title={words}
        disabled={disabled || i < done}
        ghost={m.amount === 3}
        dense
      />
    </div>
  )
  const wordsOf = (m: Move) => t.describeMoveShort(describeMove(moveInHold(hold, m), shape))
  if (inline) {
    return (
      <ol className="mt-1.5 flex flex-wrap gap-1.5">
        {moves.map((m, i) => (
          <li key={i}>{button(m, i, wordsOf(m))}</li>
        ))}
      </ol>
    )
  }
  return (
    <ol className="mt-1.5 grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1">
      {moves.map((m, i) => {
        const words = wordsOf(m)
        return (
          <li key={i} className="contents">
            {button(m, i, words)}
            <span
              className={`text-[11px] leading-snug ${i < done ? 'text-slate-600 line-through' : 'text-slate-400'}`}
            >
              {words}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
